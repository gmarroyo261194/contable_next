$screens = @(
    @{ name = "login"; id = "0c4e469708254b4dad16758d27b8e3ff" },
    @{ name = "register"; id = "bbbebfc8b21747368f823c954b0b8ed6" }
)

$projectId = "9557772041557356134"
$apiKey = "AQ.Ab8RN6KvWIUCCMS9dRmZcTnFD1_aVpJiSQyVIlpDnuUI-Edq8A"
$headers = @{
    "X-Goog-Api-Key" = $apiKey
    "Content-Type" = "application/json"
}

if (-not (Test-Path "stitch_assets")) {
    New-Item -ItemType Directory -Path "stitch_assets"
}

foreach ($screen in $screens) {
    Write-Host "Processing $($screen.name)..."
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = "get_screen"
            arguments = @{
                name = "projects/$projectId/screens/$($screen.id)"
                projectId = $projectId
                screenId = $screen.id
            }
        }
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "https://stitch.googleapis.com/mcp" -Method Post -Headers $headers -Body $body
        
        $jsonContent = $response.result.structuredContent
        if (-not $jsonContent) {
            $jsonContent = $response.result.content[0].text | ConvertFrom-Json
        }

        $htmlUrl = $jsonContent.htmlCode.downloadUrl
        $screenshotUrl = $jsonContent.screenshot.downloadUrl

        if ($htmlUrl) {
            Write-Host "Downloading HTML for $($screen.name)..."
            Invoke-WebRequest -Uri $htmlUrl -Headers @{"X-Goog-Api-Key" = $apiKey} -OutFile "stitch_assets/$($screen.name).html"
        }

        if ($screenshotUrl) {
            Write-Host "Downloading Screenshot for $($screen.name)..."
            Invoke-WebRequest -Uri $screenshotUrl -Headers @{"X-Goog-Api-Key" = $apiKey} -OutFile "stitch_assets/$($screen.name).png"
        }
    } catch {
        Write-Error "Failed to process $($screen.name): $($_.Exception.Message)"
    }
}
