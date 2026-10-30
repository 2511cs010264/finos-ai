# PowerShell Static Web Server for FinOS Frontend (Port 3000 / 5500)
$ports = @(3000, 5500, 8000, 8090)
$folder = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$boundPort = 0

foreach ($port in $ports) {
    try {
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Start()
        $boundPort = $port
        break
    } catch {
        # Port busy, try next
        Write-Host "Port $port failed: $($_.Exception.Message)"
    }
}

if ($boundPort -eq 0) {
    Write-Host "Could not bind to any port."
    exit 1
}

Write-Host "🚀 FinOS Static Frontend running at: http://localhost:$boundPort/" -ForegroundColor Green
Write-Host "⚙️ Spring Boot MySQL Backend should be running at: http://localhost:8080/" -ForegroundColor Cyan

$mimeTypes = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }

        $localPath = Join-Path $folder $path.TrimStart('/')

        if (Test-Path $localPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localPath)
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            
            $response.ContentType = "$contentType; charset=utf-8"
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.Close()
    }
} finally {
    if ($listener.IsListening) { $listener.Stop() }
}
