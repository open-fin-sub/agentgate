import logging

import pytest

from agentgate.server.logging_config import _PollingAccessLogFilter


@pytest.mark.parametrize(
    ("method", "path", "status_code", "expected"),
    [
        ("GET", "/api/overview", 200, False),
        ("GET", "/api/runs?limit=200", 200, False),
        ("GET", "/api/evaluation-tasks", 200, False),
        ("GET", "/api/overview", 503, True),
        ("POST", "/api/evaluation-tasks", 200, True),
        ("GET", "/api/datasets", 200, True),
    ],
)
def test_polling_access_log_filter(method, path, status_code, expected):
    record = logging.LogRecord(
        name="uvicorn.access",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg='%s - "%s %s HTTP/%s" %d',
        args=("127.0.0.1:12345", method, path, "1.1", status_code),
        exc_info=None,
    )

    assert _PollingAccessLogFilter().filter(record) is expected
