$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$script:OutputDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:RootDir = Split-Path -Parent (Split-Path -Parent $script:OutputDir)
$script:HeroSource = Join-Path $script:RootDir 'cypress\screenshots\debug-save-export.spec.js\debug-preview-container.png'
$script:OutputSource = Join-Path $script:RootDir 'cypress\tmp\exported-from-app.png'

function New-Canvas($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $bitmap.SetResolution(144, 144)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function New-RoundedRectPath($x, $y, $width, $height, $radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2

  if ($radius -le 0) {
    $path.AddRectangle([System.Drawing.RectangleF]::new($x, $y, $width, $height))
    return $path
  }

  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Fill-RoundedRect($graphics, $brush, $x, $y, $width, $height, $radius) {
  $path = New-RoundedRectPath $x $y $width $height $radius
  try {
    $graphics.FillPath($brush, $path)
  } finally {
    $path.Dispose()
  }
}

function Draw-RoundedRectBorder($graphics, $pen, $x, $y, $width, $height, $radius) {
  $path = New-RoundedRectPath $x $y $width $height $radius
  try {
    $graphics.DrawPath($pen, $path)
  } finally {
    $path.Dispose()
  }
}

function Draw-Shadow($graphics, $x, $y, $width, $height, $radius, $alpha = 40, $layers = 12) {
  for ($i = 0; $i -lt $layers; $i++) {
    $currentAlpha = [Math]::Max(4, [int]($alpha * (1 - ($i / $layers))))
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($currentAlpha, 8, 11, 18))
    try {
      Fill-RoundedRect $graphics $brush ($x - 5 + $i) ($y + 8 + $i) ($width + 10 - ($i * 2)) ($height + 10 - ($i * 2)) ($radius + 6)
    } finally {
      $brush.Dispose()
    }
  }
}

function Draw-GradientBackground($graphics, $width, $height, $colors, $angle) {
  $rect = [System.Drawing.RectangleF]::new(0, 0, $width, $height)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $colors[0], $colors[-1], $angle

  try {
    if ($colors.Length -gt 2) {
      $blend = New-Object System.Drawing.Drawing2D.ColorBlend
      $blend.Colors = $colors
      $blend.Positions = [single[]](0, 0.48, 1)
      $brush.InterpolationColors = $blend
    }

    $graphics.FillRectangle($brush, $rect)
  } finally {
    $brush.Dispose()
  }
}

function Draw-AccentOrb($graphics, $x, $y, $size, $color) {
  $brush = New-Object System.Drawing.SolidBrush $color
  try {
    $graphics.FillEllipse($brush, $x, $y, $size, $size)
  } finally {
    $brush.Dispose()
  }
}

function Draw-StringBlock($graphics, $text, $font, $brush, $x, $y, $width, $height, $alignment = 'Near') {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::$alignment
  $format.LineAlignment = [System.Drawing.StringAlignment]::Near
  try {
    $graphics.DrawString($text, $font, $brush, [System.Drawing.RectangleF]::new($x, $y, $width, $height), $format)
  } finally {
    $format.Dispose()
  }
}

function Draw-Chip($graphics, $text, $x, $y, $background, $foreground) {
  $font = [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $paddingX = 16
  $paddingY = 9
  $size = $graphics.MeasureString($text, $font)
  $width = [Math]::Ceiling($size.Width + ($paddingX * 2))
  $height = [Math]::Ceiling($size.Height + ($paddingY * 1.6))
  $brush = New-Object System.Drawing.SolidBrush $background
  $textBrush = New-Object System.Drawing.SolidBrush $foreground
  try {
    Fill-RoundedRect $graphics $brush $x $y $width $height 18
    Draw-StringBlock $graphics $text $font $textBrush ($x + $paddingX) ($y + 8) ($width - ($paddingX * 2)) ($height - 8)
  } finally {
    $font.Dispose()
    $brush.Dispose()
    $textBrush.Dispose()
  }

  return $width
}

function Draw-WindowDots($graphics, $x, $y) {
  $colors = @(
    [System.Drawing.Color]::FromArgb(255, 255, 95, 86),
    [System.Drawing.Color]::FromArgb(255, 255, 189, 46),
    [System.Drawing.Color]::FromArgb(255, 39, 201, 63)
  )

  for ($i = 0; $i -lt $colors.Length; $i++) {
    $brush = New-Object System.Drawing.SolidBrush $colors[$i]
    try {
      $graphics.FillEllipse($brush, $x + ($i * 18), $y, 12, 12)
    } finally {
      $brush.Dispose()
    }
  }
}

function Draw-ImageCard($graphics, $image, $x, $y, $width, $height, $radius, $borderColor) {
  Draw-Shadow $graphics $x $y $width $height $radius

  $surfaceBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 255, 255, 255))
  $borderPen = New-Object System.Drawing.Pen $borderColor, 1.2
  $clipPath = New-RoundedRectPath $x $y $width $height $radius
  try {
    Fill-RoundedRect $graphics $surfaceBrush $x $y $width $height $radius
    Draw-RoundedRectBorder $graphics $borderPen $x $y $width $height $radius
    $graphics.SetClip($clipPath)

    $sourceRatio = $image.Width / $image.Height
    $targetRatio = $width / $height

    if ($sourceRatio -gt $targetRatio) {
      $drawHeight = $height
      $drawWidth = $drawHeight * $sourceRatio
      $drawX = $x - (($drawWidth - $width) / 2)
      $drawY = $y
    } else {
      $drawWidth = $width
      $drawHeight = $drawWidth / $sourceRatio
      $drawX = $x
      $drawY = $y - (($drawHeight - $height) / 2)
    }

    $graphics.DrawImage($image, [System.Drawing.RectangleF]::new($drawX, $drawY, $drawWidth, $drawHeight))
  } finally {
    $graphics.ResetClip()
    $clipPath.Dispose()
    $surfaceBrush.Dispose()
    $borderPen.Dispose()
  }
}

function Save-Canvas($canvas, $path) {
  try {
    $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Dispose()
  }
}

function New-Brush($a, $r, $g, $b) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($a, $r, $g, $b))
}

function Draw-HeroCover($heroImage, $outputImage) {
  $canvas = New-Canvas 1600 900
  $g = $canvas.Graphics

  Draw-GradientBackground $g 1600 900 @(
    [System.Drawing.Color]::FromArgb(255, 8, 16, 34),
    [System.Drawing.Color]::FromArgb(255, 17, 53, 96),
    [System.Drawing.Color]::FromArgb(255, 103, 44, 196)
  ) 18

  Draw-AccentOrb $g -120 -60 420 ([System.Drawing.Color]::FromArgb(58, 61, 250, 218))
  Draw-AccentOrb $g 1080 -40 500 ([System.Drawing.Color]::FromArgb(42, 255, 112, 160))
  Draw-AccentOrb $g 1220 530 360 ([System.Drawing.Color]::FromArgb(50, 255, 202, 64))

  $titleBrush = New-Brush 255 245 248 255
  $bodyBrush = New-Brush 215 226 235 255
  $mutedBrush = New-Brush 170 206 220 255
  $titleFont = [System.Drawing.Font]::new('Segoe UI Semibold', 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = [System.Drawing.Font]::new('Segoe UI', 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $copyFont = [System.Drawing.Font]::new('Segoe UI', 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

  try {
    Draw-StringBlock $g 'Panda' $titleFont $titleBrush 110 120 520 80
    Draw-StringBlock $g 'Turn source code into polished, shareable, presentation-ready images.' $subtitleFont $bodyBrush 110 198 560 80
    Draw-StringBlock $g 'Panda bundles themes, backgrounds, watermark control, fast export, and local persistence into one focused workflow for docs, posts, and technical sharing.' $copyFont $mutedBrush 110 260 560 140

    $chipX = 110
    $chipX += Draw-Chip $g 'Code Poster Design' $chipX 382 ([System.Drawing.Color]::FromArgb(42, 255, 255, 255)) ([System.Drawing.Color]::FromArgb(255, 245, 250, 255))
    $chipX += 12
    $chipX += Draw-Chip $g 'Themes / BG / Watermark' $chipX 382 ([System.Drawing.Color]::FromArgb(42, 255, 255, 255)) ([System.Drawing.Color]::FromArgb(255, 245, 250, 255))
    $null = Draw-Chip $g 'PNG / JPG / WEBP / SVG' 110 436 ([System.Drawing.Color]::FromArgb(42, 255, 255, 255)) ([System.Drawing.Color]::FromArgb(255, 245, 250, 255))

    Draw-ImageCard $g $heroImage 760 92 730 500 36 ([System.Drawing.Color]::FromArgb(68, 255, 255, 255))
    Draw-ImageCard $g $outputImage 930 520 420 248 28 ([System.Drawing.Color]::FromArgb(54, 255, 255, 255))

    $badgeBrush = New-Brush 170 8 13 24
    $badgeTextBrush = New-Brush 255 255 255 255
    $badgeFont = [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    try {
      Fill-RoundedRect $g $badgeBrush 824 120 138 34 16
      Draw-StringBlock $g 'Real Output' $badgeFont $badgeTextBrush 852 128 120 24
      Fill-RoundedRect $g $badgeBrush 960 544 122 34 16
      Draw-StringBlock $g 'Exported' $badgeFont $badgeTextBrush 988 552 96 24
    } finally {
      $badgeFont.Dispose()
      $badgeBrush.Dispose()
      $badgeTextBrush.Dispose()
    }
  } finally {
    $titleBrush.Dispose()
    $bodyBrush.Dispose()
    $mutedBrush.Dispose()
    $titleFont.Dispose()
    $subtitleFont.Dispose()
    $copyFont.Dispose()
  }

  Save-Canvas $canvas (Join-Path $script:OutputDir 'hero-cover.png')
}

function Draw-EditorShowcase($outputImage) {
  $canvas = New-Canvas 1600 1020
  $g = $canvas.Graphics

  Draw-GradientBackground $g 1600 1020 @(
    [System.Drawing.Color]::FromArgb(255, 245, 248, 252),
    [System.Drawing.Color]::FromArgb(255, 229, 241, 255),
    [System.Drawing.Color]::FromArgb(255, 214, 226, 255)
  ) 28

  Draw-AccentOrb $g -80 690 380 ([System.Drawing.Color]::FromArgb(42, 34, 197, 255))
  Draw-AccentOrb $g 1270 -50 280 ([System.Drawing.Color]::FromArgb(44, 255, 112, 160))

  $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 14, 20, 35))
  $panelBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(30, 255, 255, 255)), 1.2
  $leftTextBrush = New-Brush 245 248 252 255
  $mutedBrush = New-Brush 170 197 207 225
  $pillBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 255, 255, 255))
  $titleFont = [System.Drawing.Font]::new('Segoe UI Semibold', 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = [System.Drawing.Font]::new('Segoe UI', 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $labelFont = [System.Drawing.Font]::new('Segoe UI', 13, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $copyFont = [System.Drawing.Font]::new('Segoe UI', 14, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

  try {
    Draw-Shadow $g 78 72 1440 870 42 52 16
    Fill-RoundedRect $g $panelBrush 78 72 1440 870 42
    Draw-RoundedRectBorder $g $panelBorder 78 72 1440 870 42

    Draw-WindowDots $g 120 110
    Draw-StringBlock $g 'Editor Workflow' $titleFont $leftTextBrush 120 156 320 48
    Draw-StringBlock $g 'A README-friendly panel built around Panda''s editing, background, watermark, and export story.' $subtitleFont $mutedBrush 120 210 460 64

    $featureTitles = @('Themes & Language', 'Background Sources', 'Watermark & Export', 'Local Persistence')
    $featureBodies = @(
      'Built around CodeMirror themes, fonts, and syntax highlighting.',
      'Supports color fills, gradients, built-in gallery, upload, and URL backgrounds.',
      'Ships PNG, JPG, WEBP, SVG, preview, and fast export flows.',
      'Keeps presets, import/export config, and local restoration in one loop.'
    )

    for ($i = 0; $i -lt $featureTitles.Length; $i++) {
      $boxY = 298 + ($i * 118)
      Fill-RoundedRect $g $pillBg 120 $boxY 390 94 24
      Draw-StringBlock $g $featureTitles[$i] $labelFont $leftTextBrush 146 ($boxY + 16) 180 28
      Draw-StringBlock $g $featureBodies[$i] $copyFont $mutedBrush 146 ($boxY + 44) 332 40
    }

    Draw-ImageCard $g $outputImage 560 148 878 604 30 ([System.Drawing.Color]::FromArgb(50, 255, 255, 255))

    $chipY = 808
    $chipX = 560
    foreach ($format in @('PNG', 'JPG', 'WEBP', 'SVG')) {
      $chipX += Draw-Chip $g $format $chipX $chipY ([System.Drawing.Color]::FromArgb(42, 255, 255, 255)) ([System.Drawing.Color]::FromArgb(255, 245, 250, 255))
      $chipX += 10
    }

    $rightCopyBrush = New-Brush 206 231 238 255
    Draw-StringBlock $g 'Use this panel in the README to make Panda''s export quality and editing surface understandable at a glance.' $copyFont $rightCopyBrush 560 874 820 56
    $rightCopyBrush.Dispose()
  } finally {
    $panelBrush.Dispose()
    $panelBorder.Dispose()
    $leftTextBrush.Dispose()
    $mutedBrush.Dispose()
    $pillBg.Dispose()
    $titleFont.Dispose()
    $subtitleFont.Dispose()
    $labelFont.Dispose()
    $copyFont.Dispose()
  }

  Save-Canvas $canvas (Join-Path $script:OutputDir 'editor-showcase.png')
}

function Draw-PresetCard($graphics, $x, $y, $width, $height, $title, $gradientColors, $image, $tag) {
  Draw-Shadow $graphics $x $y $width $height 34

  $rect = [System.Drawing.RectangleF]::new($x, $y, $width, $height)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $gradientColors[0], $gradientColors[-1], 28
  $blend = New-Object System.Drawing.Drawing2D.ColorBlend
  $blend.Colors = $gradientColors
  $blend.Positions = [single[]](0, 0.48, 1)
  $brush.InterpolationColors = $blend

  $border = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(26, 255, 255, 255)), 1.1
  $titleBrush = New-Brush 248 255 255 255
  $tagBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(48, 255, 255, 255))
  $tagTextBrush = New-Brush 248 255 255 255
  $titleFont = [System.Drawing.Font]::new('Segoe UI', 15, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $tagFont = [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

  try {
    Fill-RoundedRect $graphics $brush $x $y $width $height 34
    Draw-RoundedRectBorder $graphics $border $x $y $width $height 34

    Fill-RoundedRect $graphics $tagBrush ($x + 24) ($y + 22) 72 28 14
    Draw-StringBlock $graphics $tag $tagFont $tagTextBrush ($x + 44) ($y + 28) 54 20
    Draw-StringBlock $graphics $title $titleFont $titleBrush ($x + 24) ($y + 64) ($width - 48) 24
    Draw-ImageCard $graphics $image ($x + 24) ($y + 106) ($width - 48) ($height - 132) 22 ([System.Drawing.Color]::FromArgb(40, 255, 255, 255))
  } finally {
    $brush.Dispose()
    $border.Dispose()
    $titleBrush.Dispose()
    $tagBrush.Dispose()
    $tagTextBrush.Dispose()
    $titleFont.Dispose()
    $tagFont.Dispose()
  }
}

function Draw-PresetGallery($outputImage) {
  $canvas = New-Canvas 1600 980
  $g = $canvas.Graphics

  Draw-GradientBackground $g 1600 980 @(
    [System.Drawing.Color]::FromArgb(255, 12, 14, 27),
    [System.Drawing.Color]::FromArgb(255, 25, 26, 55),
    [System.Drawing.Color]::FromArgb(255, 49, 28, 79)
  ) 14

  $titleBrush = New-Brush 255 245 248 255
  $copyBrush = New-Brush 190 206 217 255
  $titleFont = [System.Drawing.Font]::new('Segoe UI Semibold', 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $copyFont = [System.Drawing.Font]::new('Segoe UI', 15, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

  try {
    Draw-StringBlock $g 'Preset Gallery' $titleFont $titleBrush 110 84 320 40
    Draw-StringBlock $g 'A README-ready gallery showing how Panda presets shift the mood through gradients, window chrome, and presentation style.' $copyFont $copyBrush 110 134 860 48

    Draw-PresetCard $g 110 234 640 312 'Mint Aura' @(
      [System.Drawing.Color]::FromArgb(255, 150, 248, 214),
      [System.Drawing.Color]::FromArgb(255, 68, 216, 248),
      [System.Drawing.Color]::FromArgb(255, 42, 201, 252)
    ) $outputImage 'P01'
    Draw-PresetCard $g 850 234 640 312 'Nebula Boxy' @(
      [System.Drawing.Color]::FromArgb(255, 42, 201, 252),
      [System.Drawing.Color]::FromArgb(255, 91, 110, 234),
      [System.Drawing.Color]::FromArgb(255, 173, 44, 254)
    ) $outputImage 'P04'
    Draw-PresetCard $g 110 590 640 312 'Warm Flame' @(
      [System.Drawing.Color]::FromArgb(255, 254, 165, 147),
      [System.Drawing.Color]::FromArgb(255, 254, 93, 111),
      [System.Drawing.Color]::FromArgb(255, 254, 21, 75)
    ) $outputImage 'P05'
    Draw-PresetCard $g 850 590 640 312 'Aurora Blend' @(
      [System.Drawing.Color]::FromArgb(255, 119, 230, 208),
      [System.Drawing.Color]::FromArgb(255, 193, 167, 245),
      [System.Drawing.Color]::FromArgb(255, 116, 97, 240)
    ) $outputImage 'P06'
  } finally {
    $titleBrush.Dispose()
    $copyBrush.Dispose()
    $titleFont.Dispose()
    $copyFont.Dispose()
  }

  Save-Canvas $canvas (Join-Path $script:OutputDir 'preset-gallery.png')
}

if (!(Test-Path $script:HeroSource)) {
  throw "Missing hero screenshot source: $script:HeroSource"
}

if (!(Test-Path $script:OutputSource)) {
  throw "Missing output screenshot source: $script:OutputSource"
}

$heroImage = [System.Drawing.Image]::FromFile($script:HeroSource)
$outputImage = [System.Drawing.Image]::FromFile($script:OutputSource)

try {
  Draw-HeroCover $heroImage $outputImage
  Draw-EditorShowcase $outputImage
  Draw-PresetGallery $outputImage
} finally {
  $heroImage.Dispose()
  $outputImage.Dispose()
}
