$files = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\\.git\\" -and
    $_.FullName -notmatch "\\dist\\" -and
    $_.FullName -notmatch "\\production_dist\\" -and
    $_.FullName -notmatch "\\\.venv\\"
}
foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        if ($null -ne $content) {
            $newContent = $content -replace 'noreply\.gkk26@gmail\.com', 'noreplay.gkk26@gmail.com'
            $newContent = $newContent -replace 'norply\.gkk26@gmail\.com', 'noreplay.gkk26@gmail.com'
            $newContent = $newContent -replace 'gkk\.interns?@gmail\.com', 'noreplay.gkk26@gmail.com'
            if ($newContent -cne $content) {
                Write-Host "Updating $($file.FullName)"
                [IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
            }
        }
    } catch {}
}
