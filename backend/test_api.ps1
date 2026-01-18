# test_api.ps1
# MyLife Backend V1 Test Suite
# Assumes server running at http://127.0.0.1:8000

$baseUrl = "http://127.0.0.1:8000"
$passCount = 0
$failCount = 0

function Test-Step {
    param (
        [string]$Name,
        [scriptblock]$Action
    )
    Write-Host "TEST: $Name" -NoNewline
    try {
        & $Action
        Write-Host " [PASS]" -ForegroundColor Green
        $script:passCount++
    }
    catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor DarkRed
        $script:failCount++
    }
}

function Assert-Status {
    param (
        [int]$Expected,
        [int]$Actual
    )
    if ($Expected -ne $Actual) {
        throw "Expected Status $Expected but got $Actual"
    }
}

# 1. GET /health
Test-Step "Health Check" {
    $res = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    if ($res.status -ne "ok") { throw "Health status not ok" }
}

# 2. GET /settings/ai
Test-Step "Get Settings" {
    $res = Invoke-RestMethod -Uri "$baseUrl/settings/ai" -Method Get
    if (-not $res.success) { throw "Response success is false" }
    if ($res.data.id -ne 1) { throw "Settings ID is not 1" }
}

# 3. PUT /settings/ai (Auto)
Test-Step "Update Settings (Auto)" {
    $body = @{ ai_provider = "auto"; local_model = "none"; openai_enabled = $false } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/settings/ai" -Method Put -Body $body -ContentType "application/json"
    if ($res.data.ai_provider -ne "auto") { throw "Failed to set auto" }
}

# 4. PUT /settings/ai (Invalid Provider -> 422)
Test-Step "Update Settings (Invalid Provider -> 422)" {
    $body = @{ ai_provider = "invalid_guy"; local_model = "none"; openai_enabled = $false } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/settings/ai" -Method Put -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed with 422"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        Assert-Status -Expected 422 -Actual $code
    }
}

# 5. PUT /settings/ai (Local + None -> 400)
Test-Step "Update Settings (Local+None -> 400)" {
    $body = @{ ai_provider = "local"; local_model = "none"; openai_enabled = $false } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/settings/ai" -Method Put -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed with 400"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        Assert-Status -Expected 400 -Actual $code
    }
}

# 6. POST /memories (Create 3 samples)
$createdIds = @()
Test-Step "Create Memories" {
    $memories = @(
        @{ title = "First Memory"; note = "This is the first note"; mood = "happy"; tags = "start, test" },
        @{ title = "Sad Day"; note = "Feeling a bit down"; mood = "sad"; tags = "rain, blue" },
        @{ title = "Work Win"; note = "Shipped the project!"; mood = "excited"; tags = "work, coding" }
    )

    foreach ($m in $memories) {
        $body = $m | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/memories/" -Method Post -Body $body -ContentType "application/json"
        
        if (-not $res.success) { throw "Failed to create memory" }
        $createdIds += $res.data.id
        Write-Host "." -NoNewline
    }
}

# 7. GET /memories (List)
Test-Step "List Memories" {
    $res = Invoke-RestMethod -Uri "$baseUrl/memories/" -Method Get
    if ($res.data.Count -lt 3) { throw "Should have at least 3 memories" }
}

# 8. GET /memories?month=YYYY-MM (Valid)
Test-Step "Filter Memories (Current Month)" {
    $currentMonth = Get-Date -Format "yyyy-MM"
    $res = Invoke-RestMethod -Uri "$baseUrl/memories/?month=$currentMonth" -Method Get
    if ($res.data.Count -eq 0) { throw "Should find memories for current month" }
}

# 9. GET /memories?month=2023-99 (Invalid -> 422)
Test-Step "Filter Memories (Invalid Month -> 422)" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/memories/?month=2023-99" -Method Get -ErrorAction Stop
        throw "Should have failed with 422"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        Assert-Status -Expected 422 -Actual $code
    }
}

# 10. GET /memories/{id}
Test-Step "Get Single Memory" {
    $id = $createdIds[0]
    $res = Invoke-RestMethod -Uri "$baseUrl/memories/$id" -Method Get
    if ($res.data.title -ne "First Memory") { throw "Title mismatch" }
}

# 11. PUT /memories/{id} (Update)
Test-Step "Update Memory & Check updated_at" {
    $id = $createdIds[0]
    # Get original
    $orig = Invoke-RestMethod -Uri "$baseUrl/memories/$id" -Method Get
    $origTime = [DateTime]$orig.data.updated_at
    
    Start-Sleep -Seconds 2
    
    $body = @{ note = "Updated note content here" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/memories/$id" -Method Put -Body $body -ContentType "application/json"
    
    $newTime = [DateTime]$res.data.updated_at
    
    if ($newTime -le $origTime) { throw "updated_at did not update ($origTime vs $newTime)" }
    if ($res.data.note -ne "Updated note content here") { throw "Note not updated" }
}

# 12. GET /recap/monthly
Test-Step "Get Monthly Recap" {
    $currentMonth = Get-Date -Format "yyyy-MM"
    $res = Invoke-RestMethod -Uri "$baseUrl/recap/monthly?month=$currentMonth" -Method Get
    if (-not $res.success) { throw "Recap failed" }
    # Just check structure
    if ($res.data.total_memories -lt 3) { throw "Recap count low" }
    Write-Host " (Summary: $($res.data.summary))" -NoNewline
}

# 13. DELETE /memories/{id}
Test-Step "Delete Memory" {
    $id = $createdIds[2] # Delete the last one
    $res = Invoke-RestMethod -Uri "$baseUrl/memories/$id" -Method Delete
    if (-not $res.success) { throw "Delete reported failure" }
    
    # Verify gone
    try {
        Invoke-RestMethod -Uri "$baseUrl/memories/$id" -Method Get -ErrorAction Stop
        # Ideally returns success:false now per our router?
        # Our router says: return {"success": False, "error": {"message": "Memory not found"}}
        # But this is inside Invoke-RestMethod. 
        # Invoke-RestMethod only throws if Status Code is 4xx/5xx.
        # Our router returns 200 OK with success=False if not found? 
        # Wait, let's check memories.py:
        # if db_memory is None: return {"success": False, ...} -> This is 200 OK by default in FastAPI if response_model is APIResponse.
        # So Invoke-RestMethod WON'T throw.
    }
    catch {
        # If we mistakenly made it 404, we catch it.
        # But if it returns 200 OK with success=False:
    }
    
    # Let's check logic:
    $check = Invoke-RestMethod -Uri "$baseUrl/memories/$id" -Method Get
    if ($check.success -eq $true) { throw "Memory still exists!" }
}

Write-Host "`n----------------------------------------"
Write-Host "Tests Completed."
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "----------------------------------------"
if ($failCount -gt 0) { exit 1 }
