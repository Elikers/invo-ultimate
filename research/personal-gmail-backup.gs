/**
 * INVO Ultimate — personal Gmail daily Drive backup (Google Apps Script).
 * Saves only published public research files. Never stores credentials or trades.
 * Source: GitHub public Elikers/invo-ultimate, immutable commit SHA.
 * Destination: existing owner-controlled Drive folder.
 */
const INVO_BACKUP = Object.freeze({
  repo: 'Elikers/invo-ultimate',
  parentFolderId: '190I89cHPzWH8AreJprHEjKMWBVpXNY7W',
  subfolderName: 'Daily Apps Script Snapshots',
  timezone: 'Asia/Manila',
  maxBytesPerFile: 4 * 1024 * 1024,
  requiredFiles: [
    'research/forward-journal.json',
    'research/forward-summary.json',
    'research/archive/forward-events.jsonl',
    'research/collector-health.json',
    'research/operations-health.json',
    'research/latest.json'
  ],
  optionalFiles: [
    'research/forward-intelligence.json',
    'research/loss-diagnosis.json',
    'research/market-intelligence.json',
    'research/integrity-risk.json'
  ],
  latestDailyFiles: 7
});

function invoHttpBytes_(url) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true, followRedirects: true,
    headers: {'Accept': 'application/vnd.github+json', 'User-Agent': 'INVO-personal-Drive-backup'}
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('GitHub HTTP ' + response.getResponseCode() + ' while fetching ' + url);
  }
  return response.getBlob().getBytes();
}
function invoHttpJson_(url) {
  return JSON.parse(Utilities.newBlob(invoHttpBytes_(url)).getDataAsString('UTF-8'));
}
function invoSha256_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function(b) {
    return ('0' + (b & 255).toString(16)).slice(-2);
  }).join('');
}
function invoRepoFileList_(tree) {
  if (!tree || tree.truncated || !Array.isArray(tree.tree)) {
    throw new Error('GitHub tree missing or truncated: refusing partial backup');
  }
  const files = {};
  tree.tree.forEach(function(item) {
    if (item.type === 'blob' && typeof item.path === 'string') files[item.path] = item;
  });
  const paths = INVO_BACKUP.requiredFiles.concat(
    INVO_BACKUP.optionalFiles.filter(function(p) { return !!files[p]; })
  );
  INVO_BACKUP.requiredFiles.forEach(function(p) {
    if (!files[p]) throw new Error('Required research file missing from source commit: ' + p);
  });
  const daily = Object.keys(files).filter(function(p) {
    return /^research\/archive\/daily\/\d{4}-\d{2}-\d{2}\.json$/.test(p);
  }).sort().slice(-INVO_BACKUP.latestDailyFiles);
  return paths.concat(daily);
}
function invoGetOrCreateFolder_(parent, name) {
  const matches = parent.getFoldersByName(name);
  if (matches.hasNext()) return matches.next();
  return parent.createFolder(name);
}
function invoLatestCompleted_(folder, commit) {
  const matches = folder.getFilesByName('COMPLETE-' + commit + '.json');
  return matches.hasNext();
}

/**
 * Run manually once for an initial verified backup; then schedule with setupINVOBackup().
 */
function backupINVOResearch() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Backup already running; retry next trigger');
  try {
    const api = 'https://api.github.com/repos/' + INVO_BACKUP.repo;
    const commitData = invoHttpJson_(api + '/commits/main');
    const commit = commitData && commitData.sha;
    if (!/^[0-9a-f]{40}$/.test(commit || '')) throw new Error('Invalid GitHub commit');
    const tree = invoHttpJson_(api + '/git/trees/' + commit + '?recursive=1');
    const paths = invoRepoFileList_(tree);
    const today = Utilities.formatDate(new Date(), INVO_BACKUP.timezone, 'yyyy-MM-dd');
    const root = DriveApp.getFolderById(INVO_BACKUP.parentFolderId);
    const backups = invoGetOrCreateFolder_(root, INVO_BACKUP.subfolderName);
    const target = invoGetOrCreateFolder_(backups, today + '-' + commit.slice(0, 12));
    if (invoLatestCompleted_(target, commit)) {
      console.log('Already backed up this immutable commit: ' + commit);
      return;
    }
    const entries = [];
    paths.forEach(function(filePath) {
      const item = tree.tree.find(function(x) { return x.path === filePath; });
      if (!item || item.size > INVO_BACKUP.maxBytesPerFile) {
        throw new Error('Research file too large or not found: ' + filePath);
      }
      const url = 'https://raw.githubusercontent.com/' + INVO_BACKUP.repo + '/' + commit + '/' + filePath;
      const bytes = invoHttpBytes_(url);
      const sha = invoSha256_(bytes);
      // Keep the pathname reversible without creating deeply nested Drive folders.
      const name = filePath.replace(/\//g, '__');
      const existing = target.getFilesByName(name);
      const file = existing.hasNext() ? existing.next() :
        target.createFile(Utilities.newBlob(bytes, 'application/octet-stream', name));
      const stored = file.getBlob().getBytes();
      if (stored.length !== bytes.length || invoSha256_(stored) !== sha) {
        throw new Error('Drive readback integrity verification failed: ' + filePath);
      }
      entries.push({path: filePath, file_name: name, bytes: bytes.length, sha256: sha});
    });
    const manifest = {
      schema: 'invo-personal-drive-backup-1', created_utc: new Date().toISOString(),
      source_repository: INVO_BACKUP.repo, source_commit: commit,
      source_visibility: 'PUBLIC_REPOSITORY', folder: target.getId(),
      files: entries, interpretation: 'Read-only public research snapshot; paper observations are not exchange fills.'
    };
    target.createFile('COMPLETE-' + commit + '.json', JSON.stringify(manifest, null, 2), MimeType.PLAIN_TEXT);
    console.log('INVO snapshot verified: ' + commit + ' / ' + entries.length + ' files / ' + target.getUrl());
  } finally { lock.releaseLock(); }
}

/** Run once after successful manual test to install a daily Google-owned trigger. */
function setupINVOBackup() {
  // Only remove duplicate triggers for our exact backup function.
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'backupINVOResearch') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('backupINVOResearch').timeBased().everyDays(1).atHour(10)
    .inTimezone(INVO_BACKUP.timezone).create();
  console.log('Daily INVO research snapshot trigger installed (approximately 10–11 AM Philippine time).');
}

/** Optional: stop automatic backups without deleting existing files. */
function disableINVOBackup() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'backupINVOResearch') ScriptApp.deleteTrigger(trigger);
  });
  console.log('INVO backup trigger removed; existing Drive snapshots preserved.');
}
