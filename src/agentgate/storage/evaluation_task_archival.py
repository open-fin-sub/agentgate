"""Archive task list entries while preserving their execution records."""

from agentgate.domain import utcnow
from agentgate.domain.evaluation_task import EvaluationTask

from . import evaluation_projection as sql


def archive_task(db, task_id: str, *, user_team_id: str, standalone: bool) -> None:
    """Call inside a write transaction, with the same run lock as association writes."""
    pk, rk, _, _, _, team = sql.keys(db)
    params = {"entry": sql.key(db, task_id), "team": sql.key(db, user_team_id)}
    lock = " FOR UPDATE" if sql.mysql(db) else ""

    if standalone:
        table = "agentgate_runs"
        run = sql.rows(
            db,
            f"SELECT id,user_team_id FROM {table} WHERE {pk}=:entry AND {team}=:team{lock}",
            params,
        )
        if not run or (run[0]["id"], run[0]["user_team_id"]) != (task_id, user_team_id):
            raise LookupError("unknown evaluation task")
        if sql.rows(
            db, f"SELECT 1 FROM agentgate_evaluation_task_runs WHERE {rk}=:entry", params,
        ):
            raise LookupError("unknown standalone evaluation run")
    else:
        table = "agentgate_evaluation_tasks"
        records = sql.rows(db, f"SELECT id,payload FROM {table} WHERE {pk}=:entry{lock}", params)
        if not records or records[0]["id"] != task_id:
            raise LookupError("unknown evaluation task")
        task = EvaluationTask.model_validate_json(records[0]["payload"])
        run_ids = task.run_ids + task.previous_run_ids
        run_keys = {f"run_{i}": sql.key(db, run_id) for i, run_id in enumerate(run_ids)}
        placeholders = ",".join(f":{key}" for key in run_keys)
        runs = sql.rows(
            db,
            f"SELECT id,user_team_id FROM agentgate_runs WHERE {team}=:team AND {pk} IN ({placeholders})",
            {**params, **run_keys},
        )
        if {run["id"] for run in runs if run["user_team_id"] == user_team_id} != set(run_ids):
            raise LookupError("unknown evaluation task")

    sql.execute(
        db,
        f"UPDATE {table} SET archived_at=:now WHERE {pk}=:entry AND archived_at IS NULL",
        {**params, "now": sql.stamp(db, utcnow())},
    )
