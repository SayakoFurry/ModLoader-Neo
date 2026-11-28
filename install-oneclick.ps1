[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Html,

    [string]$Out,

    [switch]$WithBuiltin,
    [switch]$SharedModStorage,
    [switch]$NoOpen,
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root
try { $Host.UI.RawUI.WindowTitle = 'ModLoader Neo 一键安装器' } catch { }

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Stop-WithMessage {
    param([string]$Message, [int]$Code = 1)
    Write-Host "`n[错误] $Message" -ForegroundColor Red
    if (-not $NoPause) { [void](Read-Host '按回车退出') }
    exit $Code
}

function Select-HtmlFile {
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
        $dialog = New-Object System.Windows.Forms.OpenFileDialog
        $dialog.Title = '选择官方 Degrees of Lewdity HTML'
        $dialog.Filter = 'DoL HTML (*.html)|*.html|所有文件 (*.*)|*.*'
        $dialog.CheckFileExists = $true
        $dialog.Multiselect = $false
        $dialog.InitialDirectory = $Root
        if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { return $null }
        return $dialog.FileName
    }
    catch {
        return $null
    }
}

Write-Host ''
Write-Host '  ModLoader Neo 一键安装器' -ForegroundColor Cyan
Write-Host '  官方游戏 HTML + loader + UI -> 可直接运行的新 HTML'
Write-Host ''

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Stop-WithMessage '未找到 Node.js。请先安装 Node.js 18+（https://nodejs.org/），并确保 node 在 PATH 中。' 2
}
$nodeVersion = (& node --version).Trim()
try {
    if ([version]($nodeVersion.TrimStart('v')) -lt [version]'18.0.0') {
        Stop-WithMessage "Node.js 版本过低（$nodeVersion），需要 18 或更高。" 2
    }
}
catch {
    Stop-WithMessage "无法解析 Node.js 版本：$nodeVersion" 2
}

# 1. Locate the official game HTML. If one is in the installer folder or its
# parent, use it; otherwise open a file picker.
if ([string]::IsNullOrWhiteSpace($Html)) {
    $searchDirs = @($Root, (Split-Path -Parent $Root)) | Select-Object -Unique
    $candidates = @()
    foreach ($dir in $searchDirs) {
        if (-not (Test-Path -LiteralPath $dir)) { continue }
        $candidates += Get-ChildItem -LiteralPath $dir -Filter 'Degrees of Lewdity*.html' -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -notmatch '(?i)neo' }
    }
    $candidates = @($candidates | Sort-Object FullName -Unique)
    if ($candidates.Count -eq 1) {
        $Html = $candidates[0].FullName
        Write-Host "  自动检测到: $Html"
    }
    else {
        $Html = Select-HtmlFile
        if (-not $Html) {
            $Html = Read-Host '请输入官方 Degrees of Lewdity HTML 的完整路径'
        }
    }
}

if ([string]::IsNullOrWhiteSpace($Html)) { Stop-WithMessage '未选择游戏 HTML。' 2 }
if (-not (Test-Path -LiteralPath $Html -PathType Leaf)) { Stop-WithMessage "文件不存在：$Html" 2 }
$Html = (Resolve-Path -LiteralPath $Html).Path

$text = [System.IO.File]::ReadAllText($Html)
if ($text -match 'id="neo-loader"' -or $text -match '// webpackBootstrap') {
    Stop-WithMessage '这个 HTML 已经包含 ModLoader/Neo，请选择官方原版 Degrees of Lewdity.html。' 2
}

$versionMatch = [regex]::Match($text, 'version\s*:\s*"([0-9]+(?:\.[0-9]+){2,3})"\s*,\s*versionName')
if (-not $versionMatch.Success) {
    Stop-WithMessage '没有识别到 DoL 版本号；这可能不是官方游戏 HTML。' 2
}
$version = $versionMatch.Groups[1].Value

$engineMatch = [regex]::Match($text, 'format-version="([^"]+)"')
$engine = if ($engineMatch.Success) { $engineMatch.Groups[1].Value } else { '?' }

Write-Host ''
Write-Host "  游戏版本 : $version"
Write-Host "  引擎版本 : $engine"
Write-Host "  输入文件 : $Html"

$specPath = Join-Path $Root "versions\$version.json"
$strict = Test-Path -LiteralPath $specPath
if (-not $strict) {
    Write-Host "  版本表   : 未收录，使用 _generic.json 通用适配（可能启动失败）" -ForegroundColor Yellow
}

if ([string]::IsNullOrWhiteSpace($Out)) {
    $outDir = Split-Path -Parent $Html
    $baseName = "Degrees of Lewdity [$version] Neo 1.0.6.html"
    $Out = Join-Path $outDir $baseName
    if (Test-Path -LiteralPath $Out) {
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $Out = Join-Path $outDir "Degrees of Lewdity [$version] Neo 1.0.6 ($stamp).html"
    }
}
$Out = [System.IO.Path]::GetFullPath($Out)

$packList = @()
$packDir = Join-Path $Root 'packs'
foreach ($name in @('ModLoaderGui.mod.zip', 'ModLoaderNeoUI.mod.zip')) {
    $packPath = Join-Path $packDir $name
    if (Test-Path -LiteralPath $packPath) {
        $packList += $packPath
    }
    else {
        Write-Host "  [警告] 缺少 UI mod：$packPath" -ForegroundColor Yellow
    }
}
if ($WithBuiltin) {
    $builtinDir = Join-Path $packDir 'builtin'
    if (Test-Path -LiteralPath $builtinDir) {
        $packList += @(Get-ChildItem -LiteralPath $builtinDir -Filter '*.zip' -File | ForEach-Object { $_.FullName })
    }
    else {
        Write-Host '  [警告] 未找到 packs\builtin，跳过内置 mod。' -ForegroundColor Yellow
    }
}

if ($packList.Count -eq 0) {
    Write-Host '  [警告] 未找到 UI mod，只安装 loader；游戏内将没有 Mod 管理器入口。' -ForegroundColor Yellow
}

$cli = @(
    (Join-Path $Root 'neo-install.cjs'),
    '--html', $Html,
    '--out', $Out
)
if ($strict) { $cli += '--strict' }
if ($SharedModStorage) { $cli += '--shared-mod-storage' }
foreach ($pack in $packList) { $cli += @('--pack', $pack) }

Write-Step "开始安装（$($packList.Count) 个内置 zip）"
& node @cli
$code = $LASTEXITCODE

if ($code -ne 0) {
    Write-Host "`n安装失败，退出码 $code。请查看上面的日志。" -ForegroundColor Red
    if (-not $NoPause) { [void](Read-Host '按回车退出') }
    exit $code
}

$manifestPath = "$Out.manifest.json"
Write-Host ''
Write-Host '安装完成。' -ForegroundColor Green
Write-Host "  输出 HTML : $Out"
if (Test-Path -LiteralPath $manifestPath) {
    try {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        Write-Host "  适配模式 : $($manifest.engine.mode) / $($manifest.engine.pattern) / i10n=$($manifest.engine.i10n)"
        Write-Host "  Mod 数量 : $($manifest.pack.count)"
        if ($manifest.storage) {
            Write-Host "  Mod 存储 : $($manifest.storage.mode) $($manifest.storage.namespace)"
        }
        Write-Host "  manifest  : $manifestPath"
        if (-not $manifest.versionSpec.verified) {
            Write-Host '  [提示] 该版本使用 generic 规范，建议先试玩确认。' -ForegroundColor Yellow
        }
    }
    catch { }
}
else {
    Write-Host "  manifest  : 未生成（请检查安装器输出）"
}

if (-not $NoOpen) {
    try { Start-Process -FilePath $Out } catch { Write-Host '  [提示] 无法自动打开浏览器，请手动双击输出 HTML。' -ForegroundColor Yellow }
}

if (-not $NoPause) { [void](Read-Host '按回车退出') }
exit 0
