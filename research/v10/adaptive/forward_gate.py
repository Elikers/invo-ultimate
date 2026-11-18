"""Research-only candidate safety gate. No retrospective evidence can satisfy prospective gate."""
import hashlib,json
REQUIRED=("symbol","predicted_at_ms","matured_at_ms","source_sha256","decision","net_return","registration_id")
def evaluate(records,attestation=None):
    reasons=[]
    seen=set()
    for x in records:
        if not isinstance(x,dict) or any(k not in x for k in REQUIRED):
            reasons.append("MISSING_REQUIRED_FORWARD_FIELDS");continue
        if not isinstance(x["predicted_at_ms"],int) or not isinstance(x["matured_at_ms"],int) or x["predicted_at_ms"]>=x["matured_at_ms"]:
            reasons.append("NON_CAUSAL_EVENT")
        key=(x["symbol"],x["predicted_at_ms"],x["registration_id"])
        if key in seen:reasons.append("DUPLICATE_EVENT")
        seen.add(key)
        if not isinstance(x["source_sha256"],str) or len(x["source_sha256"])!=64:
            reasons.append("INVALID_SOURCE_DIGEST")
        if not x.get("source_verified_by_independent_worker",False):
            reasons.append("SOURCE_NOT_EXTERNALLY_VERIFIED")
    if not records:reasons.append("NO_PROSPECTIVE_LABELS")
    if not isinstance(attestation,dict) or not attestation.get("independent_signature_verified",False):
        reasons.append("NO_AUTHENTICATED_ATTESTATION")
    # An audit verdict can inform further human research; never changes production release.
    return {"evidence_count":len(records),"evidence_quality_acceptable":not reasons,
            "blockers":sorted(set(reasons)),"auto_promotion":False,
            "approved_for_live":False,"production_mutated":False,
            "research_only":True}
