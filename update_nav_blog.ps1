$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = Get-ChildItem -Path $dir -Filter '*.html' | Where-Object { $_.Name -ne 'googlefc85bcb631f3f686.html' }

$navCount = 0

foreach ($file in $files) {
    $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $modified = $false

    # Skip if already has the new article
    if ($raw -match 'href="good-cps-for-minecraft"') {
        Write-Host "SKIP (already done): $($file.Name)"
        continue
    }

    # The blog dropdown closing sequence — insert new link before the two closing </div>s
    # Pattern: the what-is-a-good-cps-score link followed by closing divs
    $oldBlock = '<a href="what-is-a-good-cps-score">What Is a Good CPS Score?</a>
                    </div>
                </div>'

    $newBlock = '<a href="what-is-a-good-cps-score">What Is a Good CPS Score?</a>
                        <a href="good-cps-for-minecraft">Good CPS for Minecraft PvP</a>
                    </div>
                </div>'

    if ($raw.Contains($oldBlock)) {
        $raw = $raw.Replace($oldBlock, $newBlock)
        $modified = $true
        $navCount++
        Write-Host "NAV OK: $($file.Name)"
    } else {
        # Try alternate spacing (some files may differ slightly)
        $oldBlock2 = '<a href="what-is-a-good-cps-score">What Is a Good CPS Score?</a>
                </div>
            </div>'
        $newBlock2 = '<a href="what-is-a-good-cps-score">What Is a Good CPS Score?</a>
                    <a href="good-cps-for-minecraft">Good CPS for Minecraft PvP</a>
                </div>
            </div>'
        if ($raw.Contains($oldBlock2)) {
            $raw = $raw.Replace($oldBlock2, $newBlock2)
            $modified = $true
            $navCount++
            Write-Host "NAV OK (alt): $($file.Name)"
        } else {
            Write-Host "NAV SKIP (no match): $($file.Name)"
        }
    }

    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $raw, [System.Text.Encoding]::UTF8)
    }
}

Write-Host ""
Write-Host "==================================="
Write-Host "Nav updated: $navCount files"
Write-Host "==================================="
