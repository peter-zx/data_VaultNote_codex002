$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = "C:\Users\admin\Desktop\0505"
$Node = "C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$Extract = Join-Path $Root "tools\extract-vault-backup.js"
$Decrypt = Join-Path $Root "tools\decrypt-vault-to-csv.js"

function Z([int[]] $Codes) {
  return -join ($Codes | ForEach-Object { [char]$_ })
}

$TExportMenu = Z 0x5BFC,0x51FA,0x83DC,0x5355
$TRefreshBackup = Z 0x5237,0x65B0,0x52A0,0x5BC6,0x5907,0x4EFD
$TExportCsv = Z 0x5BFC,0x51FA,0x8868,0x683C
$TRefreshAndExport = Z 0x5237,0x65B0,0x5907,0x4EFD,0x5E76,0x5BFC,0x51FA,0x6700,0x65B0,0x8868,0x683C
$TExit = Z 0x9000,0x51FA
$TOutputFolder = Z 0x4FDD,0x5B58,0x4F4D,0x7F6E
$TOutputFiles = Z 0x8F93,0x51FA,0x6587,0x4EF6
$TChoose = Z 0x8BF7,0x9009,0x62E9
$TStep = Z 0x6B65,0x9AA4
$TReading = Z 0x6B63,0x5728,0x8BFB,0x53D6,0x6700,0x65B0
$TData = Z 0x6570,0x636E
$TDone = Z 0x5B8C,0x6210
$TBackupUpdated = Z 0x52A0,0x5BC6,0x5907,0x4EFD,0x5DF2,0x66F4,0x65B0
$TExporting = Z 0x6B63,0x5728,0x5BFC,0x51FA
$TOldCsvDeleted = Z 0x65E7,0x7684,0x8868,0x683C,0x4F1A,0x81EA,0x52A8,0x5220,0x9664
$TEnterPassword = Z 0x8BF7,0x8F93,0x5165,0x4E3B,0x5BC6,0x7801
$TCsvCreated = Z 0x6700,0x65B0,0x8868,0x683C,0x5DF2,0x751F,0x6210
$TInvalid = Z 0x65E0,0x6548,0x9009,0x62E9
$TPressEnter = Z 0x6309,0x56DE,0x8F66,0x8FD4,0x56DE
$TFailed = Z 0x5931,0x8D25
$TCheck = Z 0x8BF7,0x786E,0x8BA4,0x0043,0x006F,0x0064,0x0065,0x0078,0x5DF2,0x6253,0x5F00,0xFF0C,0x4E14,0x4E3B,0x5BC6,0x7801,0x6B63,0x786E

function Show-Menu {
  Clear-Host
  Write-Host "=========================================="
  Write-Host "VaultNote $TExportMenu / Export Menu"
  Write-Host "=========================================="
  Write-Host "[1] $TRefreshBackup / Refresh encrypted backup"
  Write-Host "[2] $TExportCsv CSV / Export CSV"
  Write-Host "[3] $TRefreshAndExport / Refresh backup and export CSV"
  Write-Host "[4] $TExit / Exit"
  Write-Host ""
  Write-Host "$TOutputFolder / Output folder:"
  Write-Host $Root
  Write-Host ""
  Write-Host "$TOutputFiles / Output files:"
  Write-Host "- vaultnote-encrypted-backup-latest.json"
  Write-Host "- vaultnote-export-latest.csv"
  Write-Host ""
}

function Refresh-Backup {
  Write-Host ""
  Write-Host "$TStep 1 / Step 1: $TReading VaultNote $TData..."
  & $Node $Extract
  if ($LASTEXITCODE -ne 0) { throw "Refresh backup failed." }
  Write-Host ""
  Write-Host "$TDone / Done: $TBackupUpdated."
}

function Export-Csv {
  Write-Host ""
  Write-Host "$TStep 2 / Step 2: $TExporting CSV."
  Write-Host "$TOldCsvDeleted. / Old vaultnote-export-*.csv files will be deleted."
  Write-Host "$TEnterPassword VaultNote. / Please enter your VaultNote master password."
  & $Node $Decrypt
  if ($LASTEXITCODE -ne 0) { throw "Export CSV failed." }
  Write-Host ""
  Write-Host "$TDone / Done: vaultnote-export-latest.csv $TCsvCreated."
}

while ($true) {
  Show-Menu
  $Choice = Read-Host "$TChoose / Choose 1-4"
  try {
    switch ($Choice) {
      "1" { Refresh-Backup; Read-Host "$TPressEnter / Press Enter to return" }
      "2" { Export-Csv; Read-Host "$TPressEnter / Press Enter to return" }
      "3" { Refresh-Backup; Export-Csv; Read-Host "$TPressEnter / Press Enter to return" }
      "4" { break }
      default { Write-Host "$TInvalid / Invalid choice."; Read-Host "$TPressEnter / Press Enter" }
    }
  } catch {
    Write-Host ""
    Write-Host "$TFailed / Failed:"
    Write-Host $_
    Write-Host "$TCheck."
    Write-Host "Please check Codex is open and the master password is correct."
    Read-Host "$TPressEnter / Press Enter to return"
  }
}
