Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap(128, 128)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Dark background
$g.Clear([System.Drawing.Color]::FromArgb(26, 26, 26))

# Blue gradient "M"
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(59, 130, 246))
$font = New-Object System.Drawing.Font('Arial', 72, [System.Drawing.FontStyle]::Bold)
$g.DrawString('M', $font, $brush, 32, 24)

$g.Dispose()
$font.Dispose()
$brush.Dispose()

# Save
New-Item -ItemType Directory -Path 'icons' -Force | Out-Null
$bmp.Save('icons\icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "Icon created at icons\icon.png"
