import { execSync } from 'child_process';
import fs from 'fs';
import { dependencies } from '../../release/app/package.json';
import { devDependencies } from '../../package.json';
import webpackPaths from '../configs/webpack.paths';

const electronVersion = devDependencies?.electron?.replace(/^[^\d]*/, '');

if (
  Object.keys(dependencies || {}).length > 0 &&
  fs.existsSync(webpackPaths.appNodeModulesPath)
) {
  const electronRebuildCmd = `../../node_modules/.bin/electron-rebuild --force --types prod,dev,optional --module-dir . --version ${electronVersion}`;
  const cmd =
    process.platform === 'win32'
      ? electronRebuildCmd.replace(/\//g, '\\')
      : electronRebuildCmd;
  execSync(cmd, {
    cwd: webpackPaths.appPath,
    stdio: 'inherit',
  });
}
