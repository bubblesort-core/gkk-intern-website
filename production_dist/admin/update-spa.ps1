# Fix broken spaNavigate syntax in admin pages
$adminDir = "d:\WEBSITES BUILT\Gkk-hire\Dashboard\public\admin"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Fix index.html and active-interns.html
# Problem: spaNavigate('applications.html?search=${encodeURIComponent(s.email)}'
# Should be: spaNavigate('applications.html?search=' + encodeURIComponent(s.email))
foreach ($fileName in @("index.html", "active-interns.html")) {
    $file = Join-Path $adminDir $fileName
    $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $content = $content.Replace(
        "spaNavigate('applications.html?search=`${encodeURIComponent(s.email)}'",
        "spaNavigate('applications.html?search=' + encodeURIComponent(s.email))"
    )
    [System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
    Write-Host "Fixed: $fileName"
}

# Fix projects.html
# Problem: spaNavigate('submissions.html?project=${p.id}'
# Should be: spaNavigate('submissions.html?project=' + p.id)
$file = Join-Path $adminDir "projects.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$content = $content.Replace(
    "spaNavigate('submissions.html?project=`${p.id}'",
    "spaNavigate('submissions.html?project=' + p.id)"
)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host "Fixed: projects.html"

# Fix batches.html
# Problem: spaNavigate(`teams.html?batch=${batchId}`;
# Should be: spaNavigate(`teams.html?batch=${batchId}`);
$file = Join-Path $adminDir "batches.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$old = 'spaNavigate(`teams.html?batch=${batchId}`;'
$new = 'spaNavigate(`teams.html?batch=${batchId}`);'
$content = $content.Replace($old, $new)
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host "Fixed: batches.html"

Write-Host "`nAll syntax fixes complete!"
