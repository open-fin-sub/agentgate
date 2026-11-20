"""Pure transformations for Dataset drafts and published versions."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from datetime import datetime

from agentgate.domain import Case, Dataset, DatasetVersion, DatasetVersionStatus


def require_unique_case_names(cases: Iterable[Case]) -> None:
    """Reject duplicate names when editing or creating a Dataset publication."""

    seen: set[str] = set()
    for case in cases:
        name = case.name.strip()
        if name in seen:
            raise ValueError(f"样本名称已存在：{name}，请修改名称后重试。")
        seen.add(name)


def _require_draft(version: DatasetVersion) -> None:
    if version.status != DatasetVersionStatus.DRAFT:
        raise ValueError("DatasetVersion operation requires a draft")


def _update_draft(
    draft: DatasetVersion,
    updated_at: datetime,
    **changes: object,
) -> DatasetVersion:
    _require_draft(draft)
    if updated_at < draft.updated_at:
        raise ValueError("updated_at must not precede the current draft update")
    return DatasetVersion.model_validate(
        {
            **draft.model_dump(mode="json"),
            **changes,
            "updated_at": updated_at,
            "content_sha256": "",
        }
    )


def create_draft(
    dataset: Dataset,
    base: DatasetVersion | None,
    draft_id: str,
    created_at: datetime,
) -> DatasetVersion:
    """Create a new draft from current catalog metadata and an optional publication."""

    if base is not None:
        if base.status != DatasetVersionStatus.PUBLISHED:
            raise ValueError("Dataset draft base must be published")
        if base.dataset_id != dataset.id:
            raise ValueError("Dataset draft base belongs to another Dataset")
    return DatasetVersion(
        id=draft_id,
        dataset_id=dataset.id,
        dataset_name=dataset.name,
        dataset_description=dataset.description,
        based_on_version=base.version if base else None,
        cases=base.cases if base else (),
        notes=base.notes if base else "",
        created_at=created_at,
        updated_at=created_at,
    )


def with_case(
    draft: DatasetVersion,
    case: Case,
    updated_at: datetime,
) -> DatasetVersion:
    """Return the draft with one Case appended or replaced by stable Case identity."""

    cases = list(draft.cases)
    index = next((index for index, item in enumerate(cases) if item.id == case.id), None)
    if index is None:
        cases.append(case)
    else:
        cases[index] = case
    # A legacy draft can be repaired one sample at a time before publishing.
    name = case.name.strip()
    require_unique_case_names(item for item in cases if item.name.strip() == name)
    return _update_draft(draft, updated_at, cases=cases)


def remove_case(
    draft: DatasetVersion,
    case_id: str,
    updated_at: datetime,
) -> DatasetVersion:
    """Return the draft without the identified Case."""

    cases = tuple(item for item in draft.cases if item.id != case_id)
    if len(cases) == len(draft.cases):
        raise ValueError(f"unknown Case: {case_id}")
    return _update_draft(draft, updated_at, cases=cases)


def copy_case(
    draft: DatasetVersion,
    case_id: str,
    new_case_id: str,
    new_name: str,
    updated_at: datetime,
) -> DatasetVersion:
    """Return the draft with an explicitly identified copy of one Case."""

    source = next((item for item in draft.cases if item.id == case_id), None)
    if source is None:
        raise ValueError(f"unknown Case: {case_id}")
    copied = Case.model_validate(
        {**source.model_dump(mode="json"), "id": new_case_id, "name": new_name}
    )
    return with_case(draft, copied, updated_at)


def reorder_cases(
    draft: DatasetVersion,
    case_ids: Sequence[str],
    updated_at: datetime,
) -> DatasetVersion:
    """Return the draft with Cases in the exact requested complete order."""

    by_id = {item.id: item for item in draft.cases}
    if len(case_ids) != len(set(case_ids)) or set(case_ids) != set(by_id):
        raise ValueError("Case order must contain every draft Case exactly once")
    return _update_draft(
        draft,
        updated_at,
        cases=tuple(by_id[case_id] for case_id in case_ids),
    )


def publish_draft(
    draft: DatasetVersion,
    publication_id: str,
    version: int,
    published_at: datetime,
) -> DatasetVersion:
    """Build an immutable numbered publication from the current draft content."""

    _require_draft(draft)
    if not draft.cases:
        raise ValueError("published DatasetVersion requires at least one Case")
    require_unique_case_names(draft.cases)
    if published_at < draft.updated_at:
        raise ValueError("published_at must not precede the current draft update")
    return DatasetVersion.model_validate(
        {
            **draft.model_dump(mode="json"),
            "id": publication_id,
            "version": version,
            "status": DatasetVersionStatus.PUBLISHED,
            "updated_at": published_at,
            "published_at": published_at,
            "content_sha256": "",
        }
    )

