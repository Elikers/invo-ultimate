#!/usr/bin/env python3
"""Send a read-only INVO paper research digest through Gmail SMTP.

Required GitHub Actions secrets: INVO_GMAIL_ADDRESS, INVO_GMAIL_APP_PASSWORD,
INVO_REPORT_TO. Never print credentials or commit them to this repository.
"""
import json
import os
import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "research" / "latest.json"
REPO_URL = "https://github.com/Elikers/invo-ultimate"
MARKETS = ("BTC", "ETH", "SOL", "JUP")

def n(value, digits=3):
    return f"{value:+.{digits}f}" if isinstance(value, (int, float)) else "N/A"

def digest(report):
    when = report.get("created_utc", "UNKNOWN")
    out = [
        "INVO ULTIMATE — AUTOMATED PAPER RESEARCH",
        f"Report generated (UTC): {when}",
        f"Research source: {report.get('source', 'Unknown')}",
        "",
        "PRELIMINARY HISTORICAL RESEARCH ONLY — NOT FINANCIAL ADVICE.",
        "Fixed strategies, no live orders; funding/real execution costs are not modeled.",
        "",
    ]
    for name in MARKETS:
        market = report.get("markets", {}).get(name, {})
        if market.get("status") != "ANALYZED":
            out.append(f"{name}: UNAVAILABLE — {market.get('reason', 'unknown error')}")
            continue
        out.append(f"{name}: {market.get('candles', '?')} validated five-minute candles")
        scenarios = [r for r in market.get("results", []) if r.get("cost_bps_round_trip") == 8]
        for row in scenarios:
            folds = row.get("folds", [])
            mid = folds[1] if len(folds) > 1 else {}
            hold = folds[2] if len(folds) > 2 else {}
            stress = next((r for r in market["results"] if
                           r.get("strategy") == row.get("strategy")
                           and r.get("cost_bps_round_trip") == 16), {})
            out.append(
                f"  {row.get('strategy', '?')}: {row.get('trade_count', 0)} trades, "
                f"middle {mid.get('count', 0)} trades/net {n(mid.get('expectancyPct'))}% "
                f"→ last {hold.get('count', 0)} trades/net {n(hold.get('expectancyPct'))}%, "
                f"last PF {n(hold.get('profitFactor'), 2)}, "
                f"8bps={row.get('screen', '?')}, "
                f"16bps={stress.get('screen', '?')}"
            )
        out.append("")
    out.extend([
        "RESEARCH INTERPRETATION",
        "A screen pass is not proof of profitability. Insufficient samples and high-cost "
        "failures require further forward observation before considering strategy changes.",
        "This automated email does not change website code or trading parameters.",
        "Strategy changes require your explicit approval.",
        "",
        f"Source report: {REPO_URL}/blob/main/research/latest.json",
        f"Workflow history: {REPO_URL}/actions/workflows/research.yml",
        "For detailed analysis and recommended improvements, review the scheduled ChatGPT report.",
    ])
    return "\n".join(out)

def main():
    sender = os.environ["INVO_GMAIL_ADDRESS"].strip()
    password = os.environ["INVO_GMAIL_APP_PASSWORD"].replace(" ", "")
    recipient = os.environ["INVO_REPORT_TO"].strip()
    if not all((sender, password, recipient)):
        raise RuntimeError("Missing email credentials; no email sent")
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    if report.get("schema") != "invo-v6.2-research-1":
        raise ValueError("Report schema is unexpected; refusing to send")
    stamp = datetime.fromisoformat(report["created_utc"].replace("Z", "+00:00"))
    if not 0 <= (datetime.now(timezone.utc) - stamp).total_seconds() < 2 * 3600:
        raise ValueError("Saved report is stale or future-dated; refusing to send outdated digest")
    message = EmailMessage()
    message["Subject"] = f"INVO Ultimate Daily Research | {stamp:%Y-%m-%d} UTC"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(digest(report))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context(), timeout=30) as mail:
        mail.login(sender, password)
        mail.send_message(message)
    print("INVO research digest sent via Gmail SMTP")

if __name__ == "__main__":
    main()
