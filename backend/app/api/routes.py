from fastapi import APIRouter, HTTPException

from app.models.schemas import AuditRequest, AuditResponse
from app.services.parser import parse_pricing
from app.services.tinyfish_client import TinyFishError, run_audit

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "app": "TinySleuth"}


@router.post("/audit", response_model=AuditResponse)
async def audit(req: AuditRequest):
    url = str(req.url)
    try:
        run = await run_audit(url)
    except TinyFishError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    pricing = parse_pricing(run.result)
    if run.status.upper() != "COMPLETED":
        return AuditResponse(
            url=url,
            status="inconclusive",
            message=f"Agent run ended with status {run.status}.",
            raw_agent_result=run.result,
        )
    if pricing is None:
        return AuditResponse(
            url=url,
            status="inconclusive",
            message="Agent finished but returned data we could not validate.",
            raw_agent_result=run.result,
        )
    return AuditResponse(url=url, status="completed", pricing=pricing, raw_agent_result=run.result)
