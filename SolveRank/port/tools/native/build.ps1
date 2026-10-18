$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
node (Join-Path $PSScriptRoot "prepare.mjs")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if (-not $env:JAVA_HOME) {
    $jdk = Get-ChildItem (Join-Path $root "tools\toolchain") -Directory -Filter "jdk-*" | Select-Object -First 1
    if (-not $jdk) { throw "Set JAVA_HOME to JDK 17+ or install it in tools\toolchain." }
    $env:JAVA_HOME = $jdk.FullName
}
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$localMaven = Join-Path $root "tools\toolchain\apache-maven-3.9.9\bin\mvn.cmd"
if (Test-Path $localMaven) { $maven = $localMaven } else { $maven = "mvn.cmd" }
& $maven -B -q -f (Join-Path $PSScriptRoot "pom.xml") package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node (Join-Path $PSScriptRoot "stamp.mjs")
exit $LASTEXITCODE
