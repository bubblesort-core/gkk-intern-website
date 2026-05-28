$ErrorActionPreference = 'Stop'

$roots = @(
  'D:\WEBSITES BUILT\Gkk-hire\Dashboard\public\admin',
  'D:\WEBSITES BUILT\Gkk-hire\Dashboard\public\js',
  'D:\WEBSITES BUILT\Gkk-hire\InternMobileApp\assets\www\admin'
)

$extensions = @('.html', '.js', '.css', '.ts')

$replacements = [ordered]@{
  'â‚¹' = '₹'
  'â€“' = '–'
  'â€”' = '—'
  'â€¦' = '…'
  'â€¢' = '•'
  'â„¹ï¸' = 'ℹ️'
  'âš ï¸' = '⚠️'
  'âœ…' = '✅'
  'âœ¨' = '✨'
  'âœ“' = '✓'
  'âŒ' = '❌'
  'â¸ï¸' = '⛔'
  'âˆ’' = '−'
  'â”€' = '─'
  'â•' = '═'
  'ðŸ“…' = '📅'
  'ðŸ”—' = '🔗'
  'ðŸŽ¥' = '🎥'
  'ðŸ•’' = '🕒'
  'ðŸ“¦' = '📦'
  'ðŸŽ¨' = '🎨'
  'ðŸ”’' = '🔒'
  'ðŸ”“' = '🔓'
  'ðŸ—‘ï¸' = '🗑️'
  'ðŸ”´' = '🔴'
  'Â·' = '·'
  'Â' = ''
}

$files = Get-ChildItem -Path $roots -Recurse -File | Where-Object { $extensions -contains $_.Extension }
$changedFiles = @()

foreach ($file in $files) {
  $original = Get-Content -LiteralPath $file.FullName -Raw
  $updated = $original

  foreach ($entry in $replacements.GetEnumerator()) {
    $updated = $updated.Replace($entry.Key, $entry.Value)
  }

  if ($updated -ne $original) {
    Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8
    $changedFiles += $file.FullName
  }
}

"ChangedFiles=$($changedFiles.Count)"
$changedFiles | ForEach-Object { $_ }
