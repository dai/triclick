import * as path from 'path';
import { glob } from 'glob';

type MochaConstructor = typeof import('mocha');

const loadModule = new Function('specifier', 'return import(specifier);') as (
  specifier: string
) => Promise<{ default: MochaConstructor }>;

export async function run(): Promise<void> {
  const { default: Mocha } = await loadModule('mocha');
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000
  });

  const testsRoot = path.resolve(__dirname, '..');

  try {
    const files = await glob('**/**.test.js', { cwd: testsRoot });

    // テストファイルを Mocha に追加
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise((resolve, reject) => {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
