import pytest

from agentgate.application import DatasetManagement
from agentgate.domain import Case, CaseTurn, DatasetVersion, DatasetVersionStatus, utcnow
from agentgate.storage.sqlite import SQLiteRepository


def test_create_edit_publish_and_preserve_old_version(tmp_path):
    service = DatasetManagement(SQLiteRepository(tmp_path / "datasets.db"))
    dataset = service.create_dataset("My Dataset", "demo")
    draft = service.create_draft(dataset.id)
    case = Case(
        id="case-1", name="Case 1",
        turns=(CaseTurn(id="turn-1", input={"message": "hello"}),),
    )
    service.save_case(dataset.id, case)
    first = service.publish_draft(dataset.id)
    assert first.version == 1
    assert first.cases[0].name == "Case 1"

    service.create_draft(dataset.id, based_on_version=1)
    changed = case.model_copy(update={"name": "Case 1 changed"})
    service.save_case(dataset.id, changed)
    second = service.publish_draft(dataset.id)
    assert second.version == 2
    assert service.get_version(dataset.id, 1).cases[0].name == "Case 1"
    assert service.get_version(dataset.id, 2).cases[0].name == "Case 1 changed"


def test_copy_dataset_has_independent_identity_and_draft(tmp_path):
    service = DatasetManagement(SQLiteRepository(tmp_path / "copy.db"))
    source = service.create_dataset("Source")
    service.create_draft(source.id)
    service.save_case(source.id, Case(
        id="case", name="Case",
        turns=(CaseTurn(id="turn", input={"message": "hello"}),),
    ))
    service.publish_draft(source.id)
    copied, draft = service.copy_dataset(source.id, "Copy")
    assert copied.id != source.id
    assert draft.dataset_id == copied.id
    assert draft.status == "draft"
    assert draft.cases[0].id != "case"


def test_archiving_hides_catalog_entry_but_preserves_published_versions(tmp_path):
    service = DatasetManagement(SQLiteRepository(tmp_path / "archive.db"))
    dataset = service.create_dataset("Archive me")
    service.create_draft(dataset.id)
    service.save_case(dataset.id, Case(
        id="case", name="Case",
        turns=(CaseTurn(id="turn", input={"message": "hello"}),),
    ))
    published = service.publish_draft(dataset.id)

    archived = service.archive_dataset(dataset.id)

    assert archived.archived is True
    assert dataset.id not in {item.id for item in service.list_datasets()}
    assert dataset.id in {
        item.id for item in service.list_datasets(include_archived=True)
    }
    assert service.get_version(dataset.id, published.version).content_sha256 == (
        published.content_sha256
    )


def test_content_hash_changes_with_case_content_not_catalog_display_name(tmp_path):
    service = DatasetManagement(SQLiteRepository(tmp_path / "hash.db"))
    dataset = service.create_dataset("Original name")
    draft = service.create_draft(dataset.id)
    empty_hash = draft.content_sha256
    case = Case(
        id="case", name="Case",
        turns=(CaseTurn(id="turn", input={"risk": "high"}),),
    )
    with_case = service.save_case(dataset.id, case)
    assert with_case.content_sha256 != empty_hash

    service.update_dataset(dataset.id, name="Renamed catalog entry")
    after_rename = service.get_draft(dataset.id)
    assert after_rename.content_sha256 == with_case.content_sha256

    changed = case.model_copy(update={
        "turns": (CaseTurn(id="turn", input={"risk": "low"}),),
    })
    changed_version = service.save_case(dataset.id, changed)
    assert changed_version.content_sha256 != with_case.content_sha256


def test_copy_reorder_remove_cases_and_discard_draft(tmp_path):
    service = DatasetManagement(SQLiteRepository(tmp_path / "case-workflows.db"))
    dataset = service.create_dataset("Case workflows")
    service.create_draft(dataset.id)
    first = Case(
        id="first", name="First",
        turns=(CaseTurn(id="first-turn", input={"message": "first"}),),
    )
    second = Case(
        id="second", name="Second",
        turns=(CaseTurn(id="second-turn", input={"message": "second"}),),
    )
    service.save_case(dataset.id, first)
    service.save_case(dataset.id, second)

    copied_version = service.copy_case(dataset.id, first.id)
    copied = next(item for item in copied_version.cases if item.id not in {"first", "second"})
    assert copied.name == "First（副本）"

    reordered = service.reorder_cases(
        dataset.id, ["second", copied.id, "first"]
    )
    assert [item.id for item in reordered.cases] == ["second", copied.id, "first"]

    removed = service.remove_case(dataset.id, "first")
    assert [item.id for item in removed.cases] == ["second", copied.id]
    service.discard_draft(dataset.id)
    assert service.repository.get_dataset(dataset.id, user_team_id="") is None


def test_repeated_sample_copy_chooses_an_unused_name(tmp_path):
    service = DatasetManagement(SQLiteRepository(tmp_path / "repeated-copy.db"))
    dataset = service.create_dataset("Sample copies")
    service.create_draft(dataset.id)
    first = Case(id="source", name=" 样本 ", turns=(CaseTurn(input={"txt": "test"}),))
    service.save_case(dataset.id, first)
    service.copy_case(dataset.id, first.id)
    copied = service.copy_case(dataset.id, first.id)

    assert [case.name for case in copied.cases] == [" 样本 ", "样本（副本）", "样本（副本 2）"]


def test_legacy_same_name_samples_can_be_repaired_in_a_new_version(tmp_path):
    repository = SQLiteRepository(tmp_path / "legacy-same-names.db")
    service = DatasetManagement(repository)
    dataset = service.create_dataset("历史重名样本")
    now = utcnow()
    cases = tuple(
        Case(id=f"sample-{index}", name=name, turns=(CaseTurn(input={"txt": str(index)}),))
        for index, name in enumerate(("第一组", " 第一组 ", "第二组", "第二组"), 1)
    )
    historical = DatasetVersion(
        dataset_id=dataset.id, dataset_name=dataset.name, version=1,
        status=DatasetVersionStatus.PUBLISHED, cases=cases,
        created_at=now, updated_at=now, published_at=now,
    )
    repository.save_dataset_version(historical)

    with pytest.raises(ValueError, match="样本名称已存在：第一组"):
        service.copy_dataset(dataset.id, "历史副本")
    assert all(item.name != "历史副本" for item in service.list_datasets())

    service.create_draft(dataset.id, based_on_version=1)
    with pytest.raises(ValueError, match="样本名称已存在：第一组"):
        service.publish_draft(dataset.id)
    service.save_case(dataset.id, cases[1].model_copy(update={"name": "第一组第二个样本"}))
    with pytest.raises(ValueError, match="样本名称已存在：第二组"):
        service.publish_draft(dataset.id)
    service.remove_case(dataset.id, cases[3].id)
    corrected = service.publish_draft(dataset.id)

    assert corrected.version == 2
    assert [item.name for item in corrected.cases] == ["第一组", "第一组第二个样本", "第二组"]
    assert service.get_version(dataset.id, 1) == historical
