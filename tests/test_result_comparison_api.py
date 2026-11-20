import pytest
from fastapi.testclient import TestClient

from agentgate.demo.loan import LOAN_DATASET, LOAN_DATASET_VERSION
from agentgate.domain import EvaluatorKind, EvaluatorSeverity
from agentgate.integrations.targets import DemoLoanTargetAdapter, resolve_demo_trace
from agentgate.server.app import create_app
from agentgate.server.user_context import UserInfo, reset_user_info, set_user_info


class RecordingDispatcher:
    def __init__(self, fail_calls: set[int] | None = None) -> None:
        self.fail_calls = fail_calls or set()
        self.run_ids: list[str] = []

    def submit(self, run_id: str) -> None:
        self.run_ids.append(run_id)
        if len(self.run_ids) in self.fail_calls:
            raise ConnectionError("redis password=secret")


def _launch_payload() -> dict[str, object]:
    return {
        "baseline_version": "loan-agent-v1-risky",
        "candidate_version": "loan-agent-v2-fixed",
        "dataset_id": LOAN_DATASET.id,
        "dataset_version": 1,
        "evaluators": [
            {"id": "skill-routing", "version": "1"},
            {"id": "final-state", "version": "1"},
        ],
    }


def test_launch_run_comparison_creates_and_dispatches_controlled_pair(
    tmp_path,
) -> None:
    dispatcher = RecordingDispatcher()
    application = create_app(tmp_path / "comparison-launch.db", dispatcher)

    with TestClient(application) as client:
        response = client.post("/api/run-comparisons", json=_launch_payload())

    assert response.status_code == 202
    body = response.json()["data"]
    assert set(body) == {"baseline", "candidate"}
    assert set(body["baseline"]) == {"run_id", "status"}
    assert set(body["candidate"]) == {"run_id", "status"}
    assert body["baseline"]["status"] == "pending"
    assert body["candidate"]["status"] == "pending"
    assert dispatcher.run_ids == [
        body["baseline"]["run_id"],
        body["candidate"]["run_id"],
    ]

    repository = application.state.dependencies.repository
    baseline = repository.get_run(body["baseline"]["run_id"])
    candidate = repository.get_run(body["candidate"]["run_id"])
    assert baseline is not None
    assert candidate is not None
    assert baseline.manifest.dataset == candidate.manifest.dataset
    assert baseline.manifest.evaluator_specs == candidate.manifest.evaluator_specs


@pytest.mark.parametrize(
    ("endpoint", "kind", "extra", "run_count"),
    [
        ("/api/evaluations", "single", {"version": "loan-agent-v1-risky"}, 1),
        (
            "/api/stability-experiments",
            "stability",
            {"version": "loan-agent-v1-risky", "repetitions": 2},
            2,
        ),
        ("/api/run-comparisons", "ab", _launch_payload(), 2),
    ],
)
def test_named_demo_creation_rejects_duplicate_before_dispatching(
    tmp_path, endpoint, kind, extra, run_count
):
    class NamedDispatcher(RecordingDispatcher):
        def submit(self, run_id: str) -> None:
            [task] = [item for item in repository.list_evaluation_tasks() if run_id in item.run_ids]
            assert task.name == "重复测评"
            assert all(repository.get_run(item) is not None for item in task.run_ids)
            super().submit(run_id)

    dispatcher = NamedDispatcher()
    app = create_app(tmp_path / "named-demo.db", dispatcher)
    dependencies = app.state.dependencies
    repository = dependencies.repository
    dataset_ids = {}
    for team in ("team-a", "team-b"):
        token = set_user_info(UserInfo(team, "fixture-user", "Fixture user"))
        try:
            dataset = dependencies.datasets.create_dataset(f"Dataset {team}")
            dependencies.datasets.create_draft(dataset.id)
            dependencies.datasets.save_case(dataset.id, LOAN_DATASET_VERSION.cases[0])
            dependencies.datasets.publish_draft(dataset.id)
            dataset_ids[team] = dataset.id
        finally:
            reset_user_info(token)

    with TestClient(app) as client:
        def submit(team, name):
            return client.post(
                endpoint,
                headers={"X-Team-Id": team, "X-User-Id": f"user-{team}"},
                json={**extra, "name": name, "dataset_id": dataset_ids[team], "dataset_version": 1},
            )

        accepted = submit("team-a", "重复测评")
        assert accepted.status_code == 202, accepted.text
        conflict = submit("team-a", " 重复测评 ")
        assert conflict.status_code == 409, conflict.text
        assert conflict.json()["message"] == "任务名称已存在，请修改名称后重试。"
        assert len(dispatcher.run_ids) == run_count

        assert submit("team-b", "重复测评").status_code == 202
        for team in ("team-a", "team-b"):
            [task] = client.get("/api/evaluation-tasks", headers={"X-Team-Id": team}).json()["data"]
            assert task["name"] == "重复测评" and task["kind"] == kind
            assert len(task["run_ids"]) == run_count
            runs = repository.list_runs(user_team_id=team)
            assert {run.id for run in runs} == set(task["run_ids"])
            assert {run.user_id for run in runs} == {f"user-{team}"}
        assert len(dispatcher.run_ids) == run_count * 2


def test_launch_run_comparison_selects_exact_historical_evaluator_version(
    tmp_path,
) -> None:
    dispatcher = RecordingDispatcher()
    application = create_app(tmp_path / "comparison-exact-evaluator.db", dispatcher)
    evaluators = application.state.dependencies.evaluators
    evaluator, _ = evaluators.create_evaluator(
        "Versioned comparison output",
        kind=EvaluatorKind.RULE,
        dimension="answer",
        metric="comparison_output_v1",
        implementation_id="final_output",
        config={},
    )
    first = evaluators.publish_draft(evaluator.id)
    evaluators.update_evaluator(evaluator.id, enabled=True)
    evaluators.create_draft(evaluator.id)
    evaluators.replace_draft(
        evaluator.id,
        kind=EvaluatorKind.RULE,
        dimension="answer",
        metric="comparison_output_v2",
        severity=EvaluatorSeverity.BLOCKING,
        implementation_id="final_output",
        implementation_version="1",
        config={},
        children=(),
        combination=None,
    )
    second = evaluators.publish_draft(evaluator.id)
    payload = _launch_payload()
    payload["evaluators"] = [{"id": evaluator.id, "version": first.version}]

    with TestClient(application) as client:
        response = client.post("/api/run-comparisons", json=payload)

    assert response.status_code == 202
    assert second.version == "2"
    baseline = application.state.dependencies.repository.get_run(
        response.json()["data"]["baseline"]["run_id"]
    )
    candidate = application.state.dependencies.repository.get_run(
        response.json()["data"]["candidate"]["run_id"]
    )
    assert baseline is not None
    assert candidate is not None
    assert baseline.manifest.evaluator_specs == (first,)
    assert candidate.manifest.evaluator_specs == (first,)


def test_launch_run_comparison_rejects_unknown_evaluator_version(tmp_path) -> None:
    application = create_app(tmp_path / "comparison-unknown-evaluator.db")
    payload = _launch_payload()
    payload["evaluators"] = [{"id": "final-state", "version": "999"}]

    with TestClient(application) as client:
        response = client.post("/api/run-comparisons", json=payload)

    assert response.status_code == 422
    assert response.json()["message"] == (
        "unknown Evaluator version: final-state@999"
    )
    assert application.state.dependencies.repository.list_runs(user_team_id="") == []


def test_launch_run_comparison_rejects_identical_versions(tmp_path) -> None:
    dispatcher = RecordingDispatcher()
    application = create_app(tmp_path / "comparison-same-version.db", dispatcher)
    payload = _launch_payload()
    payload["candidate_version"] = payload["baseline_version"]

    with TestClient(application) as client:
        response = client.post("/api/run-comparisons", json=payload)

    assert response.status_code == 422
    assert response.json()["message"] == (
        "A/B variants must use different Agent versions"
    )
    assert dispatcher.run_ids == []
    assert application.state.dependencies.repository.list_runs(user_team_id="") == []


def test_launch_run_comparison_rejects_unknown_demo_version(tmp_path) -> None:
    dispatcher = RecordingDispatcher()
    application = create_app(tmp_path / "comparison-unknown-version.db", dispatcher)
    payload = _launch_payload()
    payload["candidate_version"] = "unknown-version"

    with TestClient(application) as client:
        response = client.post("/api/run-comparisons", json=payload)

    assert response.status_code == 422
    assert response.json()["message"] == (
        "unknown demo Target version: unknown-version"
    )
    assert dispatcher.run_ids == []
    assert application.state.dependencies.repository.list_runs(user_team_id="") == []


def test_launch_run_comparison_rejects_raw_target_configuration(tmp_path) -> None:
    dispatcher = RecordingDispatcher()
    application = create_app(tmp_path / "comparison-extra-input.db", dispatcher)
    payload = _launch_payload()
    payload["invocation_config"] = {"api_key": "must-not-be-accepted"}

    with TestClient(application) as client:
        response = client.post("/api/run-comparisons", json=payload)

    assert response.status_code == 422
    assert dispatcher.run_ids == []
    assert application.state.dependencies.repository.list_runs(user_team_id="") == []


def test_launch_run_comparison_returns_partial_dispatch_states(tmp_path) -> None:
    dispatcher = RecordingDispatcher(fail_calls={1})
    application = create_app(tmp_path / "comparison-partial-dispatch.db", dispatcher)

    with TestClient(application) as client:
        response = client.post("/api/run-comparisons", json=_launch_payload())

    assert response.status_code == 202
    body = response.json()["data"]
    assert dispatcher.run_ids == [
        body["baseline"]["run_id"],
        body["candidate"]["run_id"],
    ]
    assert body["baseline"]["status"] == "waiting"
    assert body["candidate"]["status"] == "pending"
    assert "secret" not in response.text

    repository = application.state.dependencies.repository
    baseline = repository.get_run(body["baseline"]["run_id"])
    candidate = repository.get_run(body["candidate"]["run_id"])
    assert baseline is not None
    assert candidate is not None
    assert baseline.dispatch_attempts == 1
    assert candidate.error is None


def test_compare_completed_runs(tmp_path) -> None:
    application = create_app(tmp_path / "comparison-api.db")
    dependencies = application.state.dependencies
    baseline = dependencies.execute_demo_run("loan-agent-v1-risky")
    candidate = dependencies.execute_demo_run("loan-agent-v2-fixed")

    with TestClient(application) as client:
        response = client.get(
            "/api/run-comparisons",
            params={
                "baseline_run_id": baseline.id,
                "candidate_run_id": candidate.id,
            },
        )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["baseline_run_id"] == baseline.id
    assert body["candidate_run_id"] == candidate.id
    assert body["baseline_target_version"] == "loan-agent-v1-risky"
    assert body["candidate_target_version"] == "loan-agent-v2-fixed"
    assert body["overall_score_delta"] > 0
    assert any(item["change"] == "improvement" for item in body["case_deltas"])


def test_unknown_comparison_run_returns_not_found(tmp_path) -> None:
    application = create_app(tmp_path / "comparison-missing.db")

    with TestClient(application) as client:
        response = client.get(
            "/api/run-comparisons",
            params={
                "baseline_run_id": "missing-baseline",
                "candidate_run_id": "missing-candidate",
            },
        )

    assert response.status_code == 404
    assert response.json()["message"] == "unknown EvaluationRun: missing-baseline"


def test_incomplete_comparison_run_returns_conflict(tmp_path) -> None:
    dispatcher = RecordingDispatcher()
    application = create_app(tmp_path / "comparison-incomplete.db", dispatcher)
    dependencies = application.state.dependencies
    baseline = dependencies.execute_demo_run("loan-agent-v1-risky")
    candidate = dependencies.submit_demo_run("loan-agent-v2-fixed")

    with TestClient(application) as client:
        response = client.get(
            "/api/run-comparisons",
            params={
                "baseline_run_id": baseline.id,
                "candidate_run_id": candidate.id,
            },
        )

    assert response.status_code == 409
    assert dispatcher.run_ids == [candidate.id]
    assert response.json()["message"] == (
        "EvaluationReport requires a completed EvaluationRun"
    )


def test_incompatible_comparison_runs_return_conflict(tmp_path) -> None:
    application = create_app(tmp_path / "comparison-incompatible.db")
    dependencies = application.state.dependencies
    baseline = dependencies.execute_demo_run(
        "loan-agent-v1-risky",
        evaluator_ids=["skill-routing"],
    )
    candidate = dependencies.execute_demo_run(
        "loan-agent-v2-fixed",
        evaluator_ids=["final-state"],
    )

    with TestClient(application) as client:
        response = client.get(
            "/api/run-comparisons",
            params={
                "baseline_run_id": baseline.id,
                "candidate_run_id": candidate.id,
            },
        )

    assert response.status_code == 409
    assert response.json()["message"] == "reports use different primary Evaluators"


def test_copy_comparison_preserves_source_and_applies_sample_scope_and_timeout(tmp_path) -> None:
    dispatcher = RecordingDispatcher()
    application = create_app(tmp_path / "copy-comparison.db", dispatcher)
    repository = application.state.dependencies.repository
    with TestClient(application) as client:
        source = client.post("/api/run-comparisons", json=_launch_payload()).json()["data"]
        source_ids = [source[side]["run_id"] for side in ("baseline", "candidate")]
        def execute(identity):
            adapter = DemoLoanTargetAdapter(state_store={})
            try:
                return application.state.dependencies.runs.execute_run(
                    identity, adapter, resolve_demo_trace,
                )
            finally:
                adapter.close()
        for identity in source_ids:
            assert execute(identity).status == "completed"
        source_runs = [repository.get_run(identity) for identity in source_ids]
        source_reports = [client.get("/api/runs/" + identity).json() for identity in source_ids]
        payload = {**_launch_payload(), "case_ids": [LOAN_DATASET_VERSION.cases[-1].id], "timeout_seconds": 147}
        response = client.post("/api/run-comparisons", json=payload)
        assert response.status_code == 202
        copied = response.json()["data"]
        copied_ids = [copied[side]["run_id"] for side in ("baseline", "candidate")]
        assert set(source_ids).isdisjoint(copied_ids)
        for identity in copied_ids:
            run = repository.get_run(identity)
            assert run.manifest.selected_case_ids == (LOAN_DATASET_VERSION.cases[-1].id,)
            assert run.manifest.timeout_seconds == 147
            assert run.manifest.execution_cases == (LOAN_DATASET_VERSION.cases[-1],)
            assert execute(identity).status == "completed"
        assert [client.get("/api/runs/" + identity).json() for identity in source_ids] == source_reports
        assert [repository.get_run(identity) for identity in source_ids] == source_runs
        assert len(repository.list_evaluation_tasks()) == 2
        assert dispatcher.run_ids == [*source_ids, *copied_ids]


def test_comparison_invalid_sample_scope_creates_no_task(tmp_path) -> None:
    dispatcher = RecordingDispatcher()
    application = create_app(tmp_path / "copy-comparison-invalid.db", dispatcher)
    with TestClient(application) as client:
        for scope in ([], ["missing-case"], [LOAN_DATASET_VERSION.cases[0].id] * 2):
            response = client.post("/api/run-comparisons", json={**_launch_payload(), "case_ids": scope})
            assert response.status_code == 422
    assert application.state.dependencies.repository.list_runs(user_team_id="") == []
    assert application.state.dependencies.repository.list_evaluation_tasks() == []
    assert dispatcher.run_ids == []


@pytest.mark.parametrize("value", [1, 3, 30, 0, 31, 1.5, True, "2"])
@pytest.mark.parametrize("endpoint", ["/api/evaluations", "/api/run-comparisons"])
def test_all_demo_launch_paths_validate_case_concurrency(tmp_path, value, endpoint):
    application = create_app(tmp_path / "concurrency.db", RecordingDispatcher())
    body = _launch_payload() if endpoint.endswith("comparisons") else {
        "version": "loan-agent-v2-fixed", "dataset_id": LOAN_DATASET.id, "dataset_version": 1,
    }
    body["max_parallel_cases"] = value
    valid = type(value) is int and 1 <= value <= 30
    with TestClient(application) as client:
        response = client.post(endpoint, json=body)
        assert response.status_code == (202 if valid else 422), response.text
        if valid:
            data = response.json()["data"]
            ids = [data[side]["run_id"] for side in ("baseline", "candidate")] if endpoint.endswith("comparisons") else [data["run_id"]]
            assert all(application.state.dependencies.repository.get_run(rid).manifest.max_parallel_cases == value for rid in ids)
        else:
            assert application.state.dependencies.repository.list_evaluation_tasks() == []
