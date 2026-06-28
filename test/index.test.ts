import { describe, it, expect } from 'vitest';
import { verifyConditions, publish } from '../src/index.js';
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
  describe('verifyConditions', () => {
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

  describe('publish', () => {
    it('skips when CHOCOLATEY_API_KEY is not set', async () => {
      const logCalls: unknown[][] = [];
      const ctx: PluginContext = {
        ...context,
        env: {},
        logger: { log: (...args: unknown[]) => { logCalls.push(args); }, error: () => {} },
      };
      await publish(validConfig, ctx);
      expect(logCalls.some((args) => args[0]?.toString().includes('SKIP'))).toBe(true);
    });
  });
});
