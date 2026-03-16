const fs = require('fs');
const path = require('path');

const rootPackagePath = path.resolve(__dirname, '../package.json');
const releaseAppPackagePath = path.resolve(
  __dirname,
  '../release/app/package.json',
);
const releaseAppLockPath = path.resolve(
  __dirname,
  '../release/app/package-lock.json',
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const rootPackage = readJson(rootPackagePath);
const nextVersion = rootPackage.version;

if (!nextVersion) {
  throw new Error(
    'Root package.json must define a version before syncing release metadata.',
  );
}

const releaseAppPackage = readJson(releaseAppPackagePath);
releaseAppPackage.version = nextVersion;
writeJson(releaseAppPackagePath, releaseAppPackage);

if (fs.existsSync(releaseAppLockPath)) {
  const releaseAppLock = readJson(releaseAppLockPath);
  releaseAppLock.version = nextVersion;

  if (releaseAppLock.packages && releaseAppLock.packages['']) {
    releaseAppLock.packages[''].version = nextVersion;
  }

  writeJson(releaseAppLockPath, releaseAppLock);
}
