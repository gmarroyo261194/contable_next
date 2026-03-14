$screens = @(
    @{ name = "dashboard"; id = "4855c9f63fc04f1fb923f6c9634d3076" },
    @{ name = "asientos"; id = "913b628cff734ccc8204b24877822848" },
    @{ name = "plan_cuentas"; id = "0fa8d712d3fa4555858b6c5626fb7215" },
    @{ name = "entidades"; id = "56241fa3530d42fe825a654241d64ed5" },
    @{ name = "landing"; id = "6fc8c23ebe714f44a67a10481a0cbe31" },
    @{ name = "sidebar"; id = "d50f1ab9e57041a7bc112d2637031d82" }
)

$projectId = "9557772041557356134"
$apiKey = "AQ.Ab8RN6KvWIUCCMS9dRmZcTnFD1_aVpJiSQyVIlpDnuUI-Edq8A"
$headers = @{
    "X-Goog-Api-Key" = $apiKey
    "Content-Type" = "application/json"
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
}
