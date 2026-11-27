"""Normalize optional classification fields when users supply new Case content."""

from collections.abc import Mapping
from typing import Annotated, Any

from pydantic import BeforeValidator

from agentgate.domain import Case


def optional_classification(value: Any) -> Any:
    if isinstance(value, str):
        text = value.strip()
        return None if text in ("", "空") else text
    return value


def normalize_case_input(value: Any) -> Any:
    if not isinstance(value, Mapping):
        return value
    return {
        **value,
        "category": optional_classification(value.get("category")),
        "difficulty": optional_classification(value.get("difficulty")),
    }


CaseInput = Annotated[Case, BeforeValidator(normalize_case_input)]
