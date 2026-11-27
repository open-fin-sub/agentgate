from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from agentgate.application.run_scheduling import RunScheduling
from agentgate.demo.loan import LOAN_DATASET
from agentgate.domain import (
    Case,
    CaseCategory,
    CaseDifficulty,
    CaseTurn,
    Dataset,
    DatasetVersion,
    Equals,
    OutputExpectation,
    PolicyExpectation,
    SkillRouteExpectation,
    StateExpectation,
    ToolCallExpectation,
)
from agentgate.integrations.job_dispatchers.celery import execute_evaluation_run
from agentgate.integrations.targets import DemoLoanTargetAdapter, resolve_demo_trace
from agentgate.server.app import create_app


class RecordingDispatcher:
    def __init__(self) -> None:
        self.run_ids: list[str] = []

    def submit(self, run_id: str) -> None:
        self.run_ids.append(run_id)


@pytest.mark.parametrize(
    ("category", "difficulty"),
    [(CaseCategory.BOUNDARY, CaseDifficulty.HARD), (None, None)],
)
def test_web_dataset_workflow_persists_and_runs_selected_version(
    tmp_path, monkeypatch, category, difficulty,
):
    database_path = tmp_path / "dataset-api.db"
    dispatcher = RecordingDispatcher()
    monkeypatch.setenv("AGENTGATE_DB", str(database_path))
    with TestClient(create_app(database_path, dispatcher)) as client:
        created = client.post("/api/datasets", json={
            "name": "UI Dataset", "description": "created from browser",
        })
        assert created.status_code == 201
        dataset_id = created.json()["data"]["dataset"]["id"]

        case = Case(
            id="ui-high-risk",
            name="UI high risk",
            category=category,
            difficulty=difficulty,
            turns=(CaseTurn(
                id="ui-turn",
                input={
                    "skill": "loan_approval", "application_id": "UI-1",
                    "risk": "high", "amount": 80000,
                },
                expectations=(
                    SkillRouteExpectation(
                        id="route", condition=Equals(expected="loan_approval")
                    ),
                    StateExpectation(
                        id="status", path="status",
                        condition=Equals(expected="pending_review"),
                    ),
                    OutputExpectation(
                        id="output-status", path="status",
                        condition=Equals(expected="pending_review"),
                    ),
                    ToolCallExpectation(id="credit", tool="credit_inquiry"),
                    ToolCallExpectation(id="review", tool="request_human_review"),
                    ToolCallExpectation(
                        id="no-approval", tool="approve_loan", mode="forbidden"
                    ),
                    PolicyExpectation(
                        id="policy", policy_id="high_risk_requires_review"
                    ),
                ),
            ),),
        )
        saved = client.post(
            f"/api/datasets/{dataset_id}/drafts/cases",
            json=case.model_dump(mode="json"),
        )
        assert saved.status_code == 201
        published = client.post(f"/api/datasets/{dataset_id}/drafts/publish")
        assert published.status_code == 200
        assert published.json()["data"]["version"] == 1

        response = client.post("/api/evaluations", json={
            "version": "loan-agent-v2-fixed",
            "dataset_id": dataset_id,
            "dataset_version": 1,
        })
        assert response.status_code == 202
        run_id = response.json()["data"]["run_id"]
        assert dispatcher.run_ids == [run_id]
        assert execute_evaluation_run.run(run_id) == "completed"
        report = client.get(f"/api/runs/{run_id}").json()["data"]
        assert report["run"]["manifest"]["dataset"]["dataset_id"] == dataset_id
        assert report["run"]["manifest"]["dataset"]["version"] == 1
        pinned_case = report["run"]["manifest"]["dataset"]["cases"][0]
        assert pinned_case["category"] == category
        assert pinned_case["difficulty"] == difficulty
        analytics = client.get(f"/api/runs/{run_id}/analytics").json()["data"]
        assert analytics["by_category"]["available"] == (category is not None)
        assert analytics["by_difficulty"]["available"] == (difficulty is not None)
        output = next(item for item in report["results"] if item["evaluator_id"] == "final-output")
        assert output["outcome"] == "pass"
        assert output["checks"][0]["expected"]["expected"] == "pending_review"
        assert output["checks"][0]["actual"] == "pending_review"
        before = client.get(f"/api/datasets/{dataset_id}").json()["data"]
        rejected = client.delete(f"/api/datasets/{dataset_id}/versions/1")
        assert rejected.status_code == 409
        assert rejected.json()["message"] == "已发布的测评集版本不能删除，可归档整个测评集。"
        assert client.get(f"/api/datasets/{dataset_id}").json()["data"] == before
        assert client.get(f"/api/runs/{run_id}").json()["data"] == report


def test_active_and_archived_publications_remain_readable_after_delete_request(tmp_path):
    with TestClient(create_app(tmp_path / "publication.db", RecordingDispatcher())) as client:
        path = f"/api/datasets/{LOAN_DATASET.id}"
        assert client.post(path + "/drafts", json={"based_on_version": 1}).status_code == 201
        assert client.post(path + "/drafts/publish").json()["data"]["version"] == 2
        assert client.post(path + "/drafts", json={"based_on_version": 2}).status_code == 201

        for archived in (False, True):
            if archived:
                assert client.delete(path).json()["data"]["archived"] is True
            before = client.get(path).json()["data"]
            assert before["dataset"]["archived"] == archived
            for version in (1, 2):
                url = f"{path}/versions/{version}"
                assert client.delete(url).status_code == 409
                assert client.delete(url, headers={"X-Team-Id": "another-team"}).status_code == 404
            assert client.delete(path + "/versions/3").status_code == 404
            assert client.delete("/api/datasets/missing/versions/1").status_code == 404
            assert client.get(path).json()["data"] == before

        assert client.patch(path, json={"archived": False}).status_code == 200
        assert client.delete(path + "/drafts/current").status_code == 204
        assert [v["version"] for v in client.get(path).json()["data"]["versions"]] == [2, 1]


def test_archiving_after_scheduling_preserves_execution_and_restoring_allows_submission(tmp_path):
    dispatcher = RecordingDispatcher()
    app = create_app(tmp_path / "scheduled.db", dispatcher)
    dependencies = app.state.dependencies
    due = datetime.now(UTC) + timedelta(hours=1)
    settings = {"version": "loan-agent-v2-fixed", "dataset_id": LOAN_DATASET.id, "dataset_version": 1}
    with TestClient(app) as client:
        scheduled = client.post("/api/evaluations", json={**settings, "scheduled_for": due.isoformat()})
        assert scheduled.status_code == 202, scheduled.text
        run_id = scheduled.json()["data"]["run_id"]
        manifest = client.get(f"/api/runs/{run_id}/manifest").json()["data"]

        dataset_url = f"/api/datasets/{LOAN_DATASET.id}"
        archived = client.delete(dataset_url)
        assert archived.status_code == 200, archived.text
        assert client.post("/api/evaluations", json=settings).status_code == 409
        assert dispatcher.run_ids == []
        RunScheduling(dependencies.repository).dispatch_due_runs(dispatcher, now=due)
        assert dispatcher.run_ids == [run_id]
        adapter = DemoLoanTargetAdapter()
        try:
            dependencies.runs.execute_run(run_id, adapter, resolve_demo_trace)
        finally:
            adapter.close()
        report = client.get(f"/api/runs/{run_id}").json()["data"]
        assert report["run"]["status"] == "completed"
        assert report["run"]["manifest"] == manifest
        assert client.get(f"/api/runs/{run_id}/traces/high-risk-approval").status_code == 200

        restored = client.patch(dataset_url, json={"archived": False})
        assert restored.status_code == 200, restored.text
        retried = client.post("/api/evaluations", json=settings)
        assert retried.status_code == 202, retried.text
        assert dispatcher.run_ids == [run_id, retried.json()["data"]["run_id"]]


def test_publish_returns_domain_validation_message(tmp_path):
    with TestClient(create_app(tmp_path / "validation-api.db")) as client:
        created = client.post("/api/datasets", json={"name": "Empty"}).json()["data"]
        dataset_id = created["dataset"]["id"]
        response = client.post(f"/api/datasets/{dataset_id}/drafts/publish")
        assert response.status_code == 422
        assert "requires at least one Case" in response.json()["message"]


def test_draft_rejects_duplicate_sample_names_on_create_and_rename(tmp_path):
    with TestClient(create_app(tmp_path / "duplicate-sample-names.db")) as client:
        dataset = client.post("/api/datasets", json={"name": "样本重名校验"}).json()["data"]["dataset"]
        path = f"/api/datasets/{dataset['id']}/drafts"
        first = Case(
            id="one", name="第一项",
            turns=(CaseTurn(input={"txt": "hello"}), CaseTurn(input={"txt": "again"})),
        )
        second = Case(id="two", name="第二项", turns=(CaseTurn(input={"txt": "second"}),))
        assert client.post(f"{path}/cases", json=first.model_dump(mode="json")).status_code == 201

        duplicate = second.model_copy(update={"name": " 第一项 "}).model_dump(mode="json")
        rejected = client.post(f"{path}/cases", json=duplicate)
        assert rejected.status_code == 422
        assert "样本名称已存在：第一项" in rejected.json()["message"]
        assert client.post(f"{path}/cases", json=second.model_dump(mode="json")).status_code == 201

        rejected = client.put(f"{path}/cases/two", json=duplicate)
        assert rejected.status_code == 422
        assert "样本名称已存在：第一项" in rejected.json()["message"]

        edited = first.model_copy(update={"notes": "编辑自己的内容"}).model_dump(mode="json")
        saved = client.put(f"{path}/cases/one", json=edited)
        assert saved.status_code == 200
        cases = saved.json()["data"]["cases"]
        assert [(case["name"], len(case["turns"])) for case in cases] == [("第一项", 2), ("第二项", 1)]
        assert cases[0]["notes"] == "编辑自己的内容"


def test_create_and_copy_reject_duplicate_dataset_names(tmp_path):
    with TestClient(create_app(tmp_path / "duplicate-names.db")) as client:
        created = client.post("/api/datasets", json={"name": "同名测评集"})
        assert created.status_code == 201
        dataset_id = created.json()["data"]["dataset"]["id"]

        duplicate = client.post("/api/datasets", json={"name": " 同名测评集 "})
        assert duplicate.status_code == 422
        assert "测评集名称已存在" in duplicate.json()["message"]
        assert "同名测评集" in duplicate.json()["message"]

        renamed = client.post("/api/datasets", json={"name": "同名测评集 2"})
        assert renamed.status_code == 201

        case = Case(
            id="duplicate-case",
            name="Duplicate Case",
            turns=(CaseTurn(id="duplicate-turn", input={"message": "hello"}),),
        )
        assert (
            client.post(
                f"/api/datasets/{dataset_id}/drafts/cases",
                json=case.model_dump(mode="json"),
            ).status_code
            == 201
        )
        assert (
            client.post(f"/api/datasets/{dataset_id}/drafts/publish").status_code == 200
        )

        copied = client.post(
            f"/api/datasets/{dataset_id}/copy", json={"name": "同名测评集"}
        )
        assert copied.status_code == 422
        assert "测评集名称已存在" in copied.json()["message"]

        copied_renamed = client.post(
            f"/api/datasets/{dataset_id}/copy", json={"name": "同名测评集 副本"}
        )
        assert copied_renamed.status_code == 201


def test_rename_rejects_duplicate_dataset_name_within_team(tmp_path):
    headers = {"X-Team-Id": "dataset-team"}
    with TestClient(create_app(tmp_path / "rename-dataset.db")) as client:
        created = client.post("/api/datasets", json={"name": "原名称"}, headers=headers)
        assert created.status_code == 201
        dataset_id = created.json()["data"]["dataset"]["id"]
        path = f"/api/datasets/{dataset_id}"

        imported = Dataset(name=" 已归档名称 ")
        version = DatasetVersion(dataset_id=imported.id, dataset_name=imported.name)
        result = client.post(
            "/api/datasets/import",
            json={
                "format": "agentgate.dataset",
                "format_version": 1,
                "dataset": imported.model_dump(mode="json"),
                "version": version.model_dump(mode="json"),
            },
            headers=headers,
        )
        assert result.status_code == 201
        assert client.delete(f"/api/datasets/{imported.id}", headers=headers).status_code == 200

        duplicate = client.patch(path, json={"name": "已归档名称"}, headers=headers)
        assert duplicate.status_code == 422
        assert "测评集名称已存在" in duplicate.json()["message"]
        assert client.get(path, headers=headers).json()["data"]["dataset"]["name"] == "原名称"

        other_team = client.post(
            "/api/datasets", json={"name": "新名称"}, headers={"X-Team-Id": "other-team"}
        )
        assert other_team.status_code == 201
        renamed = client.patch(path, json={"name": " 新名称 "}, headers=headers)
        assert renamed.status_code == 200
        assert renamed.json()["data"]["name"] == "新名称"


def test_keep_dataset_name_when_an_existing_record_already_has_same_name(tmp_path):
    app = create_app(tmp_path / "existing-duplicate-dataset.db")
    with TestClient(app) as client:
        created = client.post("/api/datasets", json={"name": "已重名"})
        assert created.status_code == 201
        dataset_id = created.json()["data"]["dataset"]["id"]
        app.state.dependencies.repository.save_dataset(Dataset(name="已重名"))

        saved = client.patch(
            f"/api/datasets/{dataset_id}", json={"name": " 已重名 ", "description": "更新说明"}
        )
        assert saved.status_code == 200
        assert saved.json()["data"]["name"] == "已重名"
        assert saved.json()["data"]["description"] == "更新说明"


def test_json_export_and_import_routes_round_trip(tmp_path):
    with TestClient(create_app(tmp_path / "exchange-source.db")) as source:
        created = source.post("/api/datasets", json={"name": "Exchange"}).json()["data"]
        dataset_id = created["dataset"]["id"]
        case = Case(
            id="exchange-case",
            name="Exchange Case",
            turns=(CaseTurn(id="exchange-turn", input={"message": "hello"}),),
        )
        source.post(
            f"/api/datasets/{dataset_id}/drafts/cases",
            json=case.model_dump(mode="json"),
        )
        source.post(f"/api/datasets/{dataset_id}/drafts/publish")
        exported = source.get(
            f"/api/datasets/{dataset_id}/versions/1/export"
        )
        assert exported.status_code == 200
        payload = exported.json()["data"]
        assert payload["format"] == "agentgate.dataset"
        assert payload["format_version"] == 1

    with TestClient(create_app(tmp_path / "exchange-target.db")) as target:
        response = target.post("/api/datasets/import", json=payload)

        assert response.status_code == 201
        assert response.json()["data"]["dataset"]["id"] == dataset_id
        assert response.json()["data"]["version"]["version"] == 1
