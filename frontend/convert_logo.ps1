Add-Type -AssemblyName System.Drawing

# Load the JPG image
$img = [System.Drawing.Image]::FromFile("C:\Users\Aaradhy\.gemini\antigravity\brain\31b429ee-2db4-4278-82fe-6a8961a58327\uploaded_image_1768808137395.jpg")

# Save as PNG
$img.Save("mylife_logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()

Write-Host "Converted to PNG: mylife_logo.png"
