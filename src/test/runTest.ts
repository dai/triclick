import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    // Keep the Unix socket path below macOS's limit, even in long checkout paths.
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vsc-test-'));

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      version: process.env.VSCODE_TEST_VERSION || 'stable',
      launchArgs: ['--disable-extensions', '--skip-welcome', '--skip-release-notes', '--user-data-dir', userDataDir]
    });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

main();
