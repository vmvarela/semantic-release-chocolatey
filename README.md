# @vmvarela/semantic-release-chocolatey

Package binaries into Chocolatey `.nupkg` packages during semantic-release.

## Usage

```yaml
plugins:
  - '@vmvarela/semantic-release-chocolatey':
      nuspec_template: "packaging/chocolatey/template.nuspec"
      install_template: "packaging/chocolatey/chocolateyInstall.ps1"
      assets:
        - "my-cli-x86_64-windows.exe"
        - "my-cli-aarch64-windows.exe"
```

## Config

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `nuspec_template` | `string` | yes | Path to Handlebars `.nuspec` template |
| `install_template` | `string` | yes | Path to Handlebars `chocolateyInstall.ps1` template |
| `assets` | `string[]` | yes | Binary filenames (relative to `dist/`) to include in `tools/` |

## Template variables

Both templates receive these Handlebars variables:

- `{{version}}` — release version (e.g. `1.2.3`)
- `{{name}}` — package name (derived from repo basename, `semantic-release-` prefix stripped)
- `{{assets}}` — array of asset filenames from config

Example `.nuspec` template:

```xml
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>{{name}}</id>
    <version>{{version}}</version>
    <title>{{name}}</title>
    <description>My CLI tool</description>
  </metadata>
</package>
```

Example `chocolateyInstall.ps1` template:

```powershell
$ErrorActionPreference = 'Stop'
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$packageName = '{{name}}'

Install-ChocolateyZipPackage `
  -PackageName "$packageName" `
  -Url "https://github.com/vmvarela/{{name}}/releases/download/v{{version}}/{{lookup assets 0}}" `
  -UnzipLocation "$toolsDir"
```

## Requirements

- `zip` command available on `$PATH`
- `semantic-release` ^24
- Node >= 24
