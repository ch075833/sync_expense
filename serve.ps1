param(
  [int]$Port = 4173
)

$root = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
$listener.Start()
Write-Host "Sync Expense running at http://127.0.0.1:$Port/"

$types = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".svg" = "image/svg+xml"
}

function Send-Response($Stream, [int]$Status, [string]$StatusText, [byte[]]$Body, [string]$ContentType) {
  $header = "HTTP/1.1 $Status $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $buffer = New-Object byte[] 4096
      $read = $stream.Read($buffer, 0, $buffer.Length)
      if ($read -le 0) {
        $client.Close()
        continue
      }

      $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)
      $requestLine = ($request -split "`r`n")[0]
      $parts = $requestLine -split " "
      if ($parts.Length -lt 2 -or $parts[0] -ne "GET") {
        Send-Response $stream 405 "Method Not Allowed" ([System.Text.Encoding]::UTF8.GetBytes("Method Not Allowed")) "text/plain; charset=utf-8"
        continue
      }

      $requestPath = [Uri]::UnescapeDataString(($parts[1] -split "\?")[0].TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($requestPath)) {
        $requestPath = "index.html"
      }

      $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $requestPath))
      if (-not $fullPath.StartsWith($root)) {
        Send-Response $stream 403 "Forbidden" ([System.Text.Encoding]::UTF8.GetBytes("Forbidden")) "text/plain; charset=utf-8"
        continue
      }

      if (-not [System.IO.File]::Exists($fullPath)) {
        Send-Response $stream 404 "Not Found" ([System.Text.Encoding]::UTF8.GetBytes("Not Found")) "text/plain; charset=utf-8"
        continue
      }

      $extension = [System.IO.Path]::GetExtension($fullPath)
      $contentType = $types[$extension]
      if (-not $contentType) {
        $contentType = "application/octet-stream"
      }
      Send-Response $stream 200 "OK" ([System.IO.File]::ReadAllBytes($fullPath)) $contentType
    }
    finally {
      $client.Close()
    }
  }
}
finally {
  $listener.Stop()
}
