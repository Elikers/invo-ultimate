# Personal Gmail automatic INVO research backup — no Google Cloud setup

This is an alternative to the optional GitHub → Google Cloud Workload Identity Federation workflow. It is suitable for a **personal Gmail account**, because the Apps Script runs as the signed-in account that owns the Google Drive storage.

## What is backed up
The script copies the **public, published files** in `Elikers/invo-ultimate` directly from **one immutable Git commit SHA**: forward paper journal and summary, archive of captured paper state transitions, collector/operations health, latest retrospective report, optional diagnosis/intelligence reports and up to seven dated historical daily snapshot files. It includes SHA-256 checksums, verifies every file after saving, and creates a COMPLETE manifest only after a successful run.

It does **not** copy private GitHub Actions ZIP artifacts, GitHub secrets, confidential data, or private repositories. The repository is currently public. No tokens or private credentials are needed for GitHub reading. The Google authorization belongs to the owner running the Apps Script.

## Owner setup (one time)
1. Open https://script.google.com/ while signed into the **personal Google account that owns** the backup folder.
2. Choose **New project**, name it **INVO Ultimate Daily Backup**.
3. Open `research/personal-gmail-backup.gs` in the GitHub repo, copy **the entire file**, and paste it into the Apps Script editor's default `Code.gs`, replacing the placeholder content.
4. Save the Apps Script project. The destination parent folder is already configured as `190I89cHPzWH8AreJprHEjKMWBVpXNY7W` (the existing `INVO Ultimate — Verified Research Backups` folder).
5. From the function selector choose **backupINVOResearch**, then click **Run**. Google will ask you to authorize the script for Drive file access and external HTTP requests. Review the requested permissions; do not share passwords or tokens with ChatGPT.
6. Check **Executions** for success and confirm a new **Daily Apps Script Snapshots / date-SHA** folder beneath the existing backup folder. Verify the saved `COMPLETE-<40-character SHA>.json` manifest is present. Its file count and SHA-256 hashes are computed only after Drive readback verification.
7. Choose **setupINVOBackup** from the function selector and click **Run** *once*. It installs a daily clock trigger around **10–11 AM Asia/Manila**. Google schedules within a one-hour window rather than guaranteeing an exact minute.
8. In **Triggers** (clock icon) confirm there is exactly one trigger for `backupINVOResearch`. Review **Executions** periodically; Apps Script quotas/network failures can cause missed backups.
9. To stop future backups without deleting existing snapshots, run **disableINVOBackup**.

## Failure handling and limits
- Each successful snapshot is stored inside its own date/commit folder; rerunning the same SHA on the same day does not create another COMPLETE marker. Incomplete runs remain visibly incomplete and are retried on the next invocation.
- The script refuses a missing or truncated GitHub file tree and refuses missing oversized required files. It fetches one immutable GitHub SHA so the files cannot silently mix versions from different commits.
- Checksum verification detects transfer corruption, not malicious changes to the public source repository. Backups do not establish live execution or profitability.
- Apps Script is subject to Google service and execution quotas. Google does not promise an exact trigger time. This method has a dependency on GitHub public access; if the repository becomes private, a different authenticated configuration is required.
- There is **no automatic deletion or retention cleanup**. Monitor Google storage consumption. Daily snapshots may grow as the paper journal and archive grow.
- The original `.github/workflows/offsite-backup.yml` remains optional and disabled. Personal Gmail owners do **not** need to configure Google Cloud service accounts, WIF, or any GitHub secrets to use this Apps Script alternative.

Official docs:
- https://developers.google.com/apps-script/guides/triggers/installable
- https://developers.google.com/apps-script/reference/drive/drive-app
- https://developers.google.com/apps-script/guides/services/quotas
