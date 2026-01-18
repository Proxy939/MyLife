# seed_data.ps1
# Seeding script for MyLife Backend
# Generates realistic memories.
# Note: The backend 'created_at' is currently auto-set by the server to 'now'.
# This script sends the data to populate the database for the *current* month primarily,
# as backfilling dates requires backend support not yet in Phase 1 stabilization.

$baseUrl = "http://127.0.0.1:8000"

$memories = @(
    @{ title = "New Year Resolutions"; note = "Plan to workout more and code more."; mood = "excited"; tags = "planning, 2026" },
    @{ title = "Coffee with Sara"; note = "Met at the downtown cafe. Good talk."; mood = "happy"; tags = "social, friends" },
    @{ title = "Project Deadline"; note = "Stressed about the delivery tomorrow."; mood = "stressed"; tags = "work" },
    @{ title = "Rainy Day Reading"; note = "Finished the new sci-fi novel."; mood = "calm"; tags = "hobby, reading" },
    @{ title = "Grocery Run"; note = "Bought stocks for the week."; mood = "neutral"; tags = "chores" },
    @{ title = "Gym Session"; note = "Leg day. Need rest."; mood = "stressed"; tags = "health" },
    @{ title = "Coding Marathon"; note = "Built the new backend API."; mood = "excited"; tags = "coding, work" },
    @{ title = "Family Call"; note = "Talked to parents."; mood = "happy"; tags = "family" },
    @{ title = "Late Night Debugging"; note = "Fixed the critical bug."; mood = "calm"; tags = "coding" },
    @{ title = "Sunday Brunch"; note = "Pancakes were amazing."; mood = "happy"; tags = "food" }
)

Write-Host "Seeding 10 memories..." -ForegroundColor Cyan

$count = 0
foreach ($m in $memories) {
    try {
        $body = $m | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/memories/" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        if ($res.success) {
            Write-Host "Created: $($m.title)" -ForegroundColor Green
            $count++
        } else {
            Write-Host "Failed: $($m.title) - $($res.error.message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Error creating $($m.title): $_" -ForegroundColor Red
    }
}

Write-Host "`nSeeding Complete. Created $count memories." -ForegroundColor Cyan
