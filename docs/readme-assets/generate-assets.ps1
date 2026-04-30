$ErrorActionPreference = 'Stop'

$script:OutputDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-PythonExecutable {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) {
    return $python.Source
  }

  $bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
  if (Test-Path $bundledPython) {
    return $bundledPython
  }

  throw 'Python runtime not found. Install Python or use the bundled Codex runtime before running generate-assets.ps1.'
}

$pythonSource = @'
# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
import sys

ASSET_DIR = Path(sys.argv[1])

SAMPLES = {
    "hero": "export-sample.webp",
    "sample1": "export-sample1.webp",
    "sample2": "export-sample2.webp",
    "sample3": "export-sample3.webp",
    "sample4": "export-sample4.webp",
    "sample5": "export-sample5.webp",
    "sample6": "export-sample6.webp",
}

PRESET_CARDS = [
    {
        "file": "export-sample1.webp",
        "tag": "S01",
        "title": "磨砂花景",
        "subtitle": "图片背景 + 毛玻璃窗口",
        "gradient": [
            (0.0, (144, 240, 220, 255)),
            (0.55, (74, 210, 236, 255)),
            (1.0, (47, 184, 247, 255)),
        ],
    },
    {
        "file": "export-sample2.webp",
        "tag": "S02",
        "title": "轻盈渐变",
        "subtitle": "高亮代码 + 低干扰渐变",
        "gradient": [
            (0.0, (165, 246, 237, 255)),
            (0.55, (99, 180, 255, 255)),
            (1.0, (92, 122, 246, 255)),
        ],
    },
    {
        "file": "export-sample3.webp",
        "tag": "S03",
        "title": "深色终端",
        "subtitle": "深色窗口 + 技术发布感",
        "gradient": [
            (0.0, (44, 57, 94, 255)),
            (0.55, (67, 92, 165, 255)),
            (1.0, (122, 83, 222, 255)),
        ],
    },
    {
        "file": "export-sample4.webp",
        "tag": "S04",
        "title": "品牌强化",
        "subtitle": "鲜明渐变 + 品牌露出",
        "gradient": [
            (0.0, (81, 226, 215, 255)),
            (0.55, (118, 164, 255, 255)),
            (1.0, (152, 98, 246, 255)),
        ],
    },
    {
        "file": "export-sample5.webp",
        "tag": "S05",
        "title": "自然景深",
        "subtitle": "森林景深 + 柔和边框",
        "gradient": [
            (0.0, (255, 169, 142, 255)),
            (0.5, (255, 88, 126, 255)),
            (1.0, (255, 39, 99, 255)),
        ],
    },
    {
        "file": "export-sample6.webp",
        "tag": "S06",
        "title": "多边形背景",
        "subtitle": "几何材质 + 半透明叠层",
        "gradient": [
            (0.0, (145, 236, 210, 255)),
            (0.55, (164, 194, 247, 255)),
            (1.0, (116, 97, 240, 255)),
        ],
    },
]


def find_font(bold=False):
    font_dir = Path(r"C:/Windows/Fonts")
    candidates = [
        "msyhbd.ttc",
        "msyhbd.ttf",
        "simhei.ttf",
        "segoeuib.ttf",
        "arialbd.ttf",
    ] if bold else [
        "msyh.ttc",
        "msyh.ttf",
        "segoeui.ttf",
        "arial.ttf",
    ]

    for name in candidates:
        path = font_dir / name
        if path.exists():
            return str(path)
    return None


FONT_REGULAR = find_font(False)
FONT_BOLD = find_font(True) or FONT_REGULAR


def load_font(size, bold=False):
    font_path = FONT_BOLD if bold else FONT_REGULAR
    if font_path:
        return ImageFont.truetype(font_path, size)
    return ImageFont.load_default()


def blend_channel(a, b, t):
    return int(round(a + (b - a) * t))


def blend_color(c1, c2, t):
    return tuple(blend_channel(c1[i], c2[i], t) for i in range(4))


def build_gradient(size, stops):
    width, height = size
    image = Image.new("RGBA", size)
    draw = ImageDraw.Draw(image)
    for y in range(height):
        t = 0 if height == 1 else y / (height - 1)
        for index in range(len(stops) - 1):
            p0, c0 = stops[index]
            p1, c1 = stops[index + 1]
            if t <= p1 or index == len(stops) - 2:
                local = 0 if p1 == p0 else (t - p0) / (p1 - p0)
                color = blend_color(c0, c1, max(0, min(1, local)))
                draw.line((0, y, width, y), fill=color)
                break
    return image


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def add_orb(base, xy, diameter, color, blur=42):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    x, y = xy
    draw.ellipse((x, y, x + diameter, y + diameter), fill=color)
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def add_shadow(base, box, radius, alpha=88, blur=28, offset=(0, 16)):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    ox, oy = offset
    draw.rounded_rectangle((x0 + ox, y0 + oy, x1 + ox, y1 + oy), radius=radius, fill=(10, 14, 28, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def draw_card(base, box, radius, fill, border=None, border_width=2, shadow=True, shadow_alpha=88, shadow_blur=28, shadow_offset=(0, 16)):
    if shadow:
        add_shadow(base, box, radius, alpha=shadow_alpha, blur=shadow_blur, offset=shadow_offset)

    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=border, width=border_width if border else 0)
    base.alpha_composite(layer)


def draw_gradient_card(base, box, radius, stops, border=None, shadow_alpha=96):
    add_shadow(base, box, radius, alpha=shadow_alpha, blur=30, offset=(0, 18))
    width = box[2] - box[0]
    height = box[3] - box[1]
    card = build_gradient((width, height), stops)
    mask = rounded_mask((width, height), radius)
    base.paste(card, (box[0], box[1]), mask)

    if border:
        layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        draw.rounded_rectangle(box, radius=radius, outline=border, width=2)
        base.alpha_composite(layer)


def paste_cover(base, image, box, radius):
    width = box[2] - box[0]
    height = box[3] - box[1]
    fitted = ImageOps.fit(image, (width, height), Image.Resampling.LANCZOS)
    mask = rounded_mask((width, height), radius)
    base.paste(fitted, (box[0], box[1]), mask)


def paste_image_card(base, image, box, radius, fill=(255, 255, 255, 226), border=(255, 255, 255, 86), shadow_alpha=90, inner_padding=12):
    draw_card(
        base,
        box,
        radius=radius,
        fill=fill,
        border=border,
        border_width=2,
        shadow=True,
        shadow_alpha=shadow_alpha,
        shadow_blur=30,
        shadow_offset=(0, 16),
    )
    inner = (
        box[0] + inner_padding,
        box[1] + inner_padding,
        box[2] - inner_padding,
        box[3] - inner_padding,
    )
    paste_cover(base, image, inner, max(12, radius - inner_padding))


def text_size(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def wrap_text(draw, text, font, max_width):
    lines = []
    current = ""
    for char in text:
        if char == "\n":
            lines.append(current)
            current = ""
            continue
        test = current + char
        if current and draw.textlength(test, font=font) > max_width:
            lines.append(current)
            current = char
        else:
            current = test
    if current:
        lines.append(current)
    return lines


def draw_text_block(base, text, box, font, fill, line_gap=10, align="left"):
    draw = ImageDraw.Draw(base)
    lines = wrap_text(draw, text, font, box[2] - box[0])
    y = box[1]
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        if align == "center":
            x = box[0] + ((box[2] - box[0]) - width) / 2
        elif align == "right":
            x = box[2] - width
        else:
            x = box[0]
        draw.text((x, y), line, font=font, fill=fill)
        y += height + line_gap
    return y


def draw_chip(base, text, xy, fill, text_fill, font):
    draw = ImageDraw.Draw(base)
    text_w, text_h = text_size(draw, text, font)
    x, y = xy
    padding_x = 20
    padding_y = 12
    box = (x, y, x + text_w + (padding_x * 2), y + text_h + (padding_y * 2))
    draw_card(base, box, radius=20, fill=fill, shadow=False)
    draw.text((x + padding_x, y + padding_y - 1), text, font=font, fill=text_fill)
    return box[2] - box[0]


def draw_badge(base, text, xy):
    draw = ImageDraw.Draw(base)
    font = load_font(20, bold=True)
    text_w, text_h = text_size(draw, text, font)
    x, y = xy
    box = (x, y, x + text_w + 40, y + text_h + 20)
    draw_card(base, box, radius=18, fill=(11, 17, 30, 185), shadow=False)
    draw.text((x + 20, y + 9), text, font=font, fill=(255, 255, 255, 255))


def draw_window_dots(base, xy):
    draw = ImageDraw.Draw(base)
    x, y = xy
    colors = [
        (255, 95, 86, 255),
        (255, 189, 46, 255),
        (39, 201, 63, 255),
    ]
    for index, color in enumerate(colors):
        left = x + (index * 28)
        draw.ellipse((left, y, left + 16, y + 16), fill=color)


def load_samples():
    images = {}
    for key, filename in SAMPLES.items():
        path = ASSET_DIR / filename
        if not path.exists():
            raise FileNotFoundError(f"Missing sample asset: {path}")
        images[key] = Image.open(path).convert("RGB")
    return images


def build_hero_cover(samples):
    canvas = build_gradient(
        (1600, 960),
        [
            (0.0, (8, 16, 34, 255)),
            (0.58, (20, 53, 101, 255)),
            (1.0, (99, 45, 186, 255)),
        ],
    )

    add_orb(canvas, (-140, -80), 430, (55, 71, 248, 214), blur=32)
    add_orb(canvas, (1110, -50), 500, (45, 255, 118, 158), blur=40)
    add_orb(canvas, (1220, 600), 320, (48, 255, 201, 88), blur=38)

    title_font = load_font(70, bold=True)
    subtitle_font = load_font(30, bold=False)
    body_font = load_font(22, bold=False)
    chip_font = load_font(18, bold=False)
    note_font = load_font(18, bold=False)

    draw_text_block(canvas, "Panda", (110, 108, 520, 190), title_font, (247, 250, 255, 255), line_gap=0)
    draw_text_block(
        canvas,
        "把源码整理成适合分享、展示与发布的代码海报。",
        (110, 210, 620, 300),
        subtitle_font,
        (232, 239, 255, 255),
        line_gap=8,
    )
    draw_text_block(
        canvas,
        "围绕主题、背景、水印与导出格式，把出图路径压缩成一条更顺手的视觉工作流。",
        (110, 300, 630, 420),
        body_font,
        (192, 208, 232, 255),
        line_gap=10,
    )

    chip_x = 110
    chip_y = 448
    chip_x += draw_chip(canvas, "代码海报", (chip_x, chip_y), (255, 255, 255, 52), (245, 249, 255, 255), chip_font)
    chip_x += 14
    chip_x += draw_chip(canvas, "主题背景", (chip_x, chip_y), (255, 255, 255, 52), (245, 249, 255, 255), chip_font)
    chip_x += 14
    draw_chip(canvas, "水印导出", (chip_x, chip_y), (255, 255, 255, 52), (245, 249, 255, 255), chip_font)
    draw_chip(canvas, "PNG / JPG / WEBP / SVG", (110, 510), (255, 255, 255, 44), (245, 249, 255, 255), chip_font)

    paste_image_card(canvas, samples["hero"], (760, 86, 1490, 572), radius=38, fill=(255, 255, 255, 214), border=(255, 255, 255, 72))
    paste_image_card(canvas, samples["sample5"], (980, 592, 1400, 846), radius=30, fill=(255, 255, 255, 220), border=(255, 255, 255, 66), shadow_alpha=84)

    draw_badge(canvas, "真实样例", (820, 116))
    draw_badge(canvas, "自然景深", (1036, 622))
    draw_text_block(
        canvas,
        "这是一张 README 归纳图：主画面与辅助卡片都来自真实样例，用来浓缩 Panda 的成品气质与导出场景。",
        (110, 636, 650, 820),
        note_font,
        (181, 198, 223, 255),
        line_gap=10,
    )

    return canvas


def build_editor_showcase(samples):
    canvas = build_gradient(
        (1600, 1040),
        [
            (0.0, (242, 246, 255, 255)),
            (0.55, (229, 240, 255, 255)),
            (1.0, (216, 228, 252, 255)),
        ],
    )

    add_orb(canvas, (-120, 740), 360, (60, 184, 255, 68), blur=26)
    add_orb(canvas, (1280, -60), 320, (232, 131, 255, 58), blur=28)

    draw_card(
        canvas,
        (70, 70, 1530, 970),
        radius=48,
        fill=(14, 20, 36, 248),
        border=(255, 255, 255, 28),
        border_width=2,
        shadow=True,
        shadow_alpha=92,
        shadow_blur=34,
        shadow_offset=(0, 18),
    )

    draw_window_dots(canvas, (118, 112))

    title_font = load_font(48, bold=True)
    subtitle_font = load_font(21, bold=False)
    card_title_font = load_font(23, bold=True)
    card_body_font = load_font(17, bold=False)
    chip_font = load_font(18, bold=False)
    footer_font = load_font(18, bold=False)

    draw_text_block(canvas, "编辑体验总览", (120, 152, 430, 220), title_font, (246, 249, 255, 255), line_gap=0)
    draw_text_block(
        canvas,
        "这张 README 说明图用深色终端样例做主画面，把编辑、背景、水印与导出链路压缩到一张图里。",
        (120, 222, 476, 330),
        subtitle_font,
        (189, 204, 226, 255),
        line_gap=8,
    )

    feature_titles = ["主题与语言", "背景来源", "水印与导出", "本地持久化"]
    feature_bodies = [
        "围绕 CodeMirror 的主题、字体、语言高亮与窗口样式切换展开。",
        "支持纯色、渐变、内置图库、上传图片与链接背景等来源。",
        "覆盖 PNG、JPG、WEBP、SVG、快速导出、预览与复制路径。",
        "保存预设、导入导出配置，并在刷新后恢复最近一次编辑状态。",
    ]

    for index, title in enumerate(feature_titles):
        top = 338 + (index * 128)
        box = (120, top, 492, top + 104)
        draw_card(
            canvas,
            box,
            radius=26,
            fill=(255, 255, 255, 26),
            border=(255, 255, 255, 18),
            border_width=1,
            shadow=False,
        )
        draw_text_block(canvas, title, (146, top + 18, 448, top + 48), card_title_font, (245, 248, 255, 255), line_gap=0)
        draw_text_block(canvas, feature_bodies[index], (146, top + 52, 456, top + 94), card_body_font, (180, 194, 216, 255), line_gap=6)

    paste_image_card(canvas, samples["sample3"], (560, 146, 1440, 692), radius=34, fill=(255, 255, 255, 214), border=(255, 255, 255, 68))
    draw_badge(canvas, "主讲解图", (624, 176))

    chip_x = 560
    chip_y = 760
    for format_name in ["PNG", "JPG", "WEBP", "SVG"]:
        chip_x += draw_chip(canvas, format_name, (chip_x, chip_y), (255, 255, 255, 44), (245, 249, 255, 255), chip_font)
        chip_x += 12

    draw_text_block(
        canvas,
        "上方画面用于讲清产品工作流；README 样例区则继续承担真实输出展示职责。",
        (560, 848, 1410, 920),
        footer_font,
        (201, 214, 234, 255),
        line_gap=8,
    )

    return canvas


def build_preset_gallery(samples):
    canvas = build_gradient(
        (1600, 1300),
        [
            (0.0, (11, 13, 27, 255)),
            (0.56, (25, 26, 56, 255)),
            (1.0, (49, 29, 84, 255)),
        ],
    )

    add_orb(canvas, (-130, 820), 420, (46, 201, 255, 44), blur=30)
    add_orb(canvas, (1260, -120), 420, (188, 98, 255, 42), blur=32)

    title_font = load_font(50, bold=True)
    subtitle_font = load_font(22, bold=False)
    card_title_font = load_font(28, bold=True)
    card_body_font = load_font(17, bold=False)
    tag_font = load_font(16, bold=True)
    footer_font = load_font(18, bold=False)

    draw_text_block(canvas, "预设风格归纳图", (108, 88, 560, 150), title_font, (246, 249, 255, 255), line_gap=0)
    draw_text_block(
        canvas,
        "这张图把六种代表性样例放到同一张画布里，便于在 README 中快速理解 Panda 的风格跨度。",
        (110, 156, 980, 238),
        subtitle_font,
        (198, 209, 228, 255),
        line_gap=8,
    )

    positions = [
        (100, 262, 750, 562),
        (850, 262, 1500, 562),
        (100, 592, 750, 892),
        (850, 592, 1500, 892),
        (100, 922, 750, 1222),
        (850, 922, 1500, 1222),
    ]

    for meta, box in zip(PRESET_CARDS, positions):
        draw_gradient_card(canvas, box, radius=34, stops=meta["gradient"], border=(255, 255, 255, 28), shadow_alpha=92)

        tag_box = (box[0] + 24, box[1] + 22, box[0] + 106, box[1] + 56)
        draw_card(canvas, tag_box, radius=17, fill=(255, 255, 255, 38), shadow=False)
        draw_text_block(canvas, meta["tag"], (tag_box[0] + 24, tag_box[1] + 8, tag_box[2] - 14, tag_box[3]), tag_font, (245, 249, 255, 255), line_gap=0)
        draw_text_block(canvas, meta["title"], (box[0] + 24, box[1] + 72, box[2] - 24, box[1] + 108), card_title_font, (248, 251, 255, 255), line_gap=0)
        draw_text_block(canvas, meta["subtitle"], (box[0] + 24, box[1] + 114, box[2] - 24, box[1] + 152), card_body_font, (237, 242, 255, 255), line_gap=6)

        image_lookup = {
            "export-sample1.webp": samples["sample1"],
            "export-sample2.webp": samples["sample2"],
            "export-sample3.webp": samples["sample3"],
            "export-sample4.webp": samples["sample4"],
            "export-sample5.webp": samples["sample5"],
            "export-sample6.webp": samples["sample6"],
        }
        paste_image_card(
            canvas,
            image_lookup[meta["file"]],
            (box[0] + 24, box[1] + 152, box[2] - 24, box[3] - 24),
            radius=24,
            fill=(255, 255, 255, 210),
            border=(255, 255, 255, 54),
            shadow_alpha=76,
            inner_padding=10,
        )

    draw_text_block(
        canvas,
        "这是一张 README 归纳图：它压缩的是风格范围，不替代上面的真实导出样例。",
        (110, 1240, 1120, 1288),
        footer_font,
        (201, 213, 231, 255),
        line_gap=8,
    )

    return canvas


def main():
    samples = load_samples()
    hero_cover = build_hero_cover(samples)
    editor_showcase = build_editor_showcase(samples)
    preset_gallery = build_preset_gallery(samples)

    hero_cover.save(ASSET_DIR / "hero-cover.png", format="PNG")
    editor_showcase.save(ASSET_DIR / "editor-showcase.png", format="PNG")
    preset_gallery.save(ASSET_DIR / "preset-gallery.png", format="PNG")


if __name__ == "__main__":
    main()
'@

$pythonPath = Get-PythonExecutable
$tempScript = Join-Path ([System.IO.Path]::GetTempPath()) "panda-readme-assets.py"

Set-Content -LiteralPath $tempScript -Value $pythonSource -Encoding UTF8

try {
  & $pythonPath $tempScript $script:OutputDir
  if ($LASTEXITCODE -ne 0) {
    throw "Asset generation failed with exit code $LASTEXITCODE."
  }
} finally {
  Remove-Item -LiteralPath $tempScript -Force -ErrorAction SilentlyContinue
}
