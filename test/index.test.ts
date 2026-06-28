import { describe, it, expect } from 'vitest';
import { verifyConditions } from '../src/index.js';
import type { PluginContext } from '@vmvarela/semantic-release-shared';

const validConfig = {
  nuspec_template: 'test.nuspec',
  install_template: 'test.ps1',
  assets: ['my-cli.exe'],
};

const context: PluginContext = {
  logger: { log: () => {}, error: () => {} },
  nextRelease: { version: '1.0.0' },
  branch: { name: 'main' },
  repositoryUrl: 'https://github.com/vmvarela/my-cli',
  env: {},
  cwd: '/tmp/test',
};

describe('chocolatey', () => {
  it('rejects missing nuspec template', async () => {
    await expect(verifyConditions(validConfig, context)).rejects.toThrow();
  });
  it('rejects empty config', async () => {
    await expect(verifyConditions({}, context)).rejects.toThrow();
  });
  it('rejects empty assets', async () => {
    await expect(
      verifyConditions({ ...validConfig, assets: [] }, context),
    ).rejects.toThrow();
  });
});
