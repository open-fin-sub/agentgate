"""Synchronously execute a persisted Run without a Celery broker or worker."""

from __future__ import annotations

import argparse
import logging
import os
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

LOGGER = logging.getLogger(__name__)

def execute_persisted_run(run_id: str) -> str:
    # Keep import failures inside the process boundary; stdout remains the status contract.
    from agentgate.domain import run as run_model
    from agentgate.integrations.job_dispatchers.execution import execute_persisted_run as execute
    LOGGER.info("BJS modules: run_id=%r domain_module=%s execution_module=%s",
                run_id, run_model.__file__, sys.modules[execute.__module__].__file__)
    return execute(run_id)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Synchronously execute a persisted evaluation Run by id.",
    )
    parser.add_argument("run_id", help="The id of the evaluation Run to execute.")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    LOGGER.info("BJS worker started: run_id=%r pid=%s python=%s version=%s script=%s",
                args.run_id, os.getpid(), sys.executable, sys.version.split()[0], __file__)
    try:
        status = execute_persisted_run(args.run_id)
    except Exception as exc:  # noqa: BLE001 -- Process boundary must not print credentials.
        LOGGER.error("BJS worker failed: run_id=%r exit_code=1 error_type=%s frames=%r",
                     args.run_id, type(exc).__name__,
                     [(f.filename, f.lineno, f.name) for f in traceback.extract_tb(exc.__traceback__)][-12:])
        print(f"Run execution failed: {type(exc).__name__}", file=sys.stderr)
        return 1
    print(status)
    # Existing running/completed/cancelled Runs are acknowledged duplicate deliveries.
    exit_code = 0 if status in {"completed", "cancelled", "running"} else 1
    LOGGER.info("BJS worker finished: run_id=%r status=%s exit_code=%s", args.run_id, status, exit_code)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
