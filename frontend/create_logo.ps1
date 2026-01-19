Add-Type -AssemblyName System.Drawing

# Load the JPG image
$jpg = [System.Drawing.Image]::FromFile("C:\Users\Aaradhy\.gemini\antigravity\brain\31b429ee-2db4-4278-82fe-6a8961a58327\uploaded_image_1768808137395.jpg")

# Create a new bitmap with the same size
$bmp = New-Object System.Drawing.Bitmap($jpg.Width, $jpg.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Draw the original image
$g.DrawImage($jpg, 0, 0, $jpg.Width, $jpg.Height)

# Add "MyLife" text at the bottom
$font = New-Object System.Drawing.Font('Arial', 48, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50, 50, 50))
$text = "MyLife"
$size = $g.MeasureString($text, $font)
$x = ($jpg.Width - $size.Width) / 2
$y = $jpg.Height - $size.Height - 20
$g.DrawString($text, $font, $brush, $x, $y)

# Cleanup
$g.Dispose()
$jpg.Dispose()
$font.Dispose()
$brush.Dispose()

# Save as PNG
$bmp.Save("mylife_logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "Logo created successfully!"
