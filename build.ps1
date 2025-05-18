<#
.SYNOPSIS
    Build script that copies HTML files, compiles TypeScript, and opens index.html
.DESCRIPTION
    This script:
    1. Copies all .html files from ./src to ./build
    2. Runs the TypeScript compiler (tsc)
    3. Opens index.html in the default browser
#>

# Parameters
$srcDir = "./src"
$buildDir = "./build"

# 1. Create build directory if it doesn't exist
if (-not (Test-Path -Path $buildDir)) {
    Write-Host "Creating build directory..."
    New-Item -ItemType Directory -Path $buildDir | Out-Null
}

# 2. Copy all HTML files from src to build
Write-Host "Copying HTML files from $srcDir to $buildDir..."
Get-ChildItem -Path $srcDir -Filter *.html | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $buildDir -Force
    Write-Host "Copied: $($_.Name)"
}

# 3. Run TypeScript compiler
Write-Host "Running TypeScript compiler (tsc)..."
try {
    tsc
    Write-Host "TypeScript compilation completed."
}
catch {
    Write-Host "Error running TypeScript compiler: $_" -ForegroundColor Red
    exit 1
}

# 4. Open index.html in default browser
$indexPath = Join-Path -Path $buildDir -ChildPath "index.html"
if (Test-Path -Path $indexPath) {
    Write-Host "Opening index.html in default browser..."
    Start-Process "http:localhost:5500/build/"
}
else {
    Write-Host "index.html not found in build directory." -ForegroundColor Red
    exit 1
}

Write-Host "Build process completed successfully." -ForegroundColor Green