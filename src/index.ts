import { ChocolateyConfigSchema, exec, template } from '@vmvarela/semantic-release-shared';
import type { ChocolateyConfig, PluginContext, PrepareResult } from '@vmvarela/semantic-release-shared';
import { access, mkdtemp, readFile, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function verifyConditions(
  config: unknown,
  context: PluginContext,
): Promise<void> {
  const parsed = ChocolateyConfigSchema.parse(config);
  const { nuspec_template, install_template } = parsed;

  const nuspecPath = path.resolve(context.cwd, nuspec_template);
  const installPath = path.resolve(context.cwd, install_template);

  if (!(await fileExists(nuspecPath))) {
    throw new Error(`[chocolatey] .nuspec template not found: ${nuspecPath}`);
  }
  if (!(await fileExists(installPath))) {
    throw new Error(`[chocolatey] Install script template not found: ${installPath}`);
  }

  context.logger.log('[chocolatey] Config valid, templates found');
}

export async function prepare(
  config: unknown,
  context: PluginContext,
): Promise<PrepareResult> {
  const { nuspec_template, install_template, assets } = config as ChocolateyConfig;
  const cwd = context.cwd;
  const version = context.nextRelease.version;

  // Read templates
  const nuspecTpl = await readFile(path.resolve(cwd, nuspec_template), 'utf-8');
  const installTpl = await readFile(path.resolve(cwd, install_template), 'utf-8');

  // Build template context
  const ctx = { version, assets, name: path.basename(cwd) };
  const nuspecContent = template.renderString(nuspecTpl, ctx);
  const installContent = template.renderString(installTpl, ctx);

  // Create temp dir with package structure
  const tmpdir = await mkdtemp(path.join(os.tmpdir(), 'choco-'));
  const pkgName = path.basename(cwd).replace(/^semantic-release-/, '');
  const pkgDir = path.join(tmpdir, pkgName);

  await exec('mkdir', ['-p', path.join(pkgDir, 'tools')], { cwd: tmpdir });
  await writeFile(path.join(pkgDir, `${pkgName}.nuspec`), nuspecContent, 'utf-8');
  await writeFile(path.join(pkgDir, 'tools', 'chocolateyInstall.ps1'), installContent, 'utf-8');

  // Copy assets
  for (const asset of assets) {
    const src = path.resolve(cwd, 'dist', asset);
    const dst = path.join(pkgDir, 'tools', asset);
    await cp(src, dst);
  }

  // Create .nupkg (ZIP with .nupkg extension)
  const nupkgName = `${pkgName}.${version}.nupkg`;
  await exec('zip', ['-r', path.resolve(cwd, 'dist', nupkgName), pkgName], { cwd: tmpdir });

  // Cleanup
  await exec('rm', ['-rf', tmpdir], {});

  context.logger.log(`[chocolatey] Package created: ${nupkgName}`);

  return {
    artifacts: [{ path: `dist/${nupkgName}`, name: nupkgName, type: 'package' as const }],
    version,
  };
}
