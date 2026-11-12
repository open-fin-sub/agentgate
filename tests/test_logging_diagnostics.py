"""Failure diagnostics retain identifiers without exposing request or payload secrets."""
import json
import logging
from datetime import timedelta
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError
from test_bjs_dispatcher import RawResponse
from test_run_engine import StubTargetAdapter, engine, pending_run

from agentgate.application import RunScheduling
from agentgate.domain import EvaluationRun, RunStatus, transition_run, utcnow
from agentgate.domain.run import RunTiming
from agentgate.integrations.job_dispatchers.bjs_job_dispatcher import BjsJobDispatcher
from agentgate.run.events import RunEventRecorder
from agentgate.server.app import create_app
from agentgate.storage import mysql_schema
from agentgate.storage.mysql import MySQLRepository, _validated_models
from agentgate.storage.sqlite import SQLiteRepository

SECRET = "private-credential-sentinel"

@pytest.mark.parametrize("body,keyword", [
    (SECRET.encode(), "decode failed"),
    (json.dumps([SECRET]).encode(), "shape invalid"),
    (json.dumps({"code": 7, "message": SECRET}).encode(), "submission rejected"),
])
def test_bjs_response_failure_has_run_but_not_body(body, keyword, caplog):
    caplog.set_level(logging.INFO)
    opener = Mock(return_value=RawResponse(body))
    dispatcher = BjsJobDispatcher("https://bjs.test/submit", "job-one", opener=opener)
    with pytest.raises(RuntimeError):
        dispatcher.submit("run-one")
    assert keyword in caplog.text and "run-one" in caplog.text
    assert "body_bytes=" in caplog.text and SECRET not in caplog.text
    assert opener.call_count == 1


def test_bjs_timeout_is_unconfirmed_and_not_retried(caplog):
    opener = Mock(side_effect=TimeoutError(SECRET))
    dispatcher = BjsJobDispatcher("https://bjs.test/submit", "job-one", opener=opener)
    with pytest.raises(RuntimeError):
        dispatcher.submit("run-one")
    assert "acceptance=unknown" in caplog.text and "latency_ms=" in caplog.text
    assert SECRET not in caplog.text and opener.call_count == 1


def test_best_effort_event_failure_preserves_business_flow(caplog):
    repository = Mock()
    repository.start_run_event.side_effect = RuntimeError(SECRET)
    repository.finish_run_event.side_effect = RuntimeError(SECRET)
    repository.finish_open_run_events.side_effect = RuntimeError(SECRET)
    recorder = RunEventRecorder(repository, "run-one", request_id="request-one")
    event = recorder.start("execution", "Execution")
    recorder.finish(event)
    recorder.finish_open(None)
    assert "request-one" in caplog.text and "run-one" in caplog.text
    assert "error_type=RuntimeError" in caplog.text
    assert SECRET not in caplog.text


def test_mysql_payload_failure_identifies_row_without_input(caplog):
    with pytest.raises(ValidationError):
        _validated_models([{"id": "bad-run", "payload": json.dumps({"timing": SECRET})}],
                          mysql_schema.runs, EvaluationRun)
    assert "bad-run" in caplog.text and "agentgate_runs" in caplog.text
    assert "timing" in caplog.text and SECRET not in caplog.text


def test_sqlite_payload_failure_identifies_row_without_input(tmp_path, caplog):
    repo = SQLiteRepository(tmp_path / "bad.db")
    run = pending_run()
    repo.save_run(run)
    with repo._connect() as db:
        db.execute("UPDATE agentgate_runs SET payload=? WHERE id=?",
                   (json.dumps({"timing": SECRET}), run.id))
    with pytest.raises(ValidationError):
        repo.get_run(run.id)
    assert run.id in caplog.text and "Stored payload invalid" in caplog.text
    assert SECRET not in caplog.text


def test_mysql_driver_failure_logs_errno_not_statement_or_parameters(caplog):
    repo = object.__new__(MySQLRepository)
    import os
    repo._closed, repo._pid = False, os.getpid()
    repo._engine = Mock()
    repo._engine.begin.side_effect = OperationalError(SECRET, {"password": SECRET},
                                                      Exception(1213, SECRET))
    with pytest.raises(RuntimeError), repo._transaction():
        pass
    assert "errno=1213" in caplog.text and SECRET not in caplog.text


def test_recovery_logs_actual_deadline_inputs(tmp_path, caplog, monkeypatch):
    monkeypatch.setenv("AGENTGATE_PENDING_TIMEOUT_SECONDS", "60")
    repo = SQLiteRepository(tmp_path / "recovery.db")
    now = utcnow()
    run = pending_run().model_copy(update={"timing": RunTiming(pending_started_at=now)})
    repo.save_run(run)
    recovered = RunScheduling(repo).recover_stale_runs(now=now + timedelta(seconds=61))
    assert recovered[0].status == RunStatus.FAILED
    for field in (run.id, "pending_timeout_seconds=60", "case_timeout_seconds=", "grace_seconds=30", "deadline="):
        assert field in caplog.text


def test_original_error_logged_before_terminal_write_failure(tmp_path, caplog, monkeypatch):
    repo = SQLiteRepository(tmp_path / "engine.db")
    run = pending_run()
    repo.save_run(run)
    original_save = repo.save_run
    def broken_summary(completed, summary):
        current = repo.get_run(run.id)
        original_save(transition_run(current, RunStatus.FAILED, error="timeout"))
        raise RuntimeError(SECRET)
    monkeypatch.setattr(repo, "save_completed_run", broken_summary)
    with pytest.raises(ValueError, match="terminal EvaluationRun"):
        engine(repo).execute(run, StubTargetAdapter())
    assert "stage=summary_persistence error_type=RuntimeError" in caplog.text
    assert "stored_status=failed" in caplog.text
    assert "reason=terminal_immutable" in caplog.text
    assert SECRET not in caplog.text


def test_api_request_failure_has_identity_and_safe_validation(tmp_path, caplog):
    caplog.set_level(logging.DEBUG)
    app = create_app(tmp_path / "api.db")
    with TestClient(app) as client:
        response = client.get("/api/evaluation-task-summaries?page=bad",
                              headers={"X-Team-Id": "team-one", "X-User-Id": "user-one", "token": SECRET})
    assert response.status_code == 422
    assert "API validation failed" in caplog.text
    assert "team-one" in caplog.text and "status=422" in caplog.text
    assert SECRET not in caplog.text
