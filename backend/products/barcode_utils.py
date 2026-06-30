import io
from PIL import Image, ImageDraw, ImageFont

# Code-128B patterns (width notation) — must EXACTLY match frontend decoder
CODE128_WIDTH = [
    '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
    '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
    '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
    '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
    '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
    '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
    '314111','221411','431111','111224','111422','121124','121421','131122','131221','112214',
    '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
    '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
    '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
]
CODE128_STOP_WIDTH = '233111'


START_CODE_B = '211214'  # Code-128 Start B in width notation


def encode_code128b(text):
    """Encode text to Code-128B width patterns with Start Code B and stop."""
    cleaned = str(text).encode('ascii', errors='replace').decode('ascii')
    patterns = [START_CODE_B]
    for ch in cleaned:
        idx = ord(ch) - 32
        if 0 <= idx < len(CODE128_WIDTH):
            patterns.append(CODE128_WIDTH[idx])
        else:
            patterns.append(CODE128_WIDTH[0])
    patterns.append(CODE128_STOP_WIDTH)
    return patterns, cleaned


def generate_barcode_image(code, width=400, height=120, module_width=2):
    """Generate a scannable Code-128 barcode PNG matching the frontend decoder."""
    patterns, cleaned = encode_code128b(code)

    total_modules = 0
    for p in patterns:
        total_modules += sum(int(c) for c in p)

    img_width = module_width * total_modules + 40
    img_height = height

    img = Image.new('RGB', (img_width, img_height), 'white')
    draw = ImageDraw.Draw(img)

    x = 20
    for p in patterns:
        for i, ch in enumerate(p):
            w = int(ch) * module_width
            if i % 2 == 0:
                draw.rectangle([x, 10, x + w - 1, height - 30], fill='black')
            x += w

    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except (OSError, IOError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), cleaned, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((img_width - tw) // 2, height - 25), cleaned, fill='black', font=font)

    if img_width > width:
        ratio = width / img_width
        new_w = int(img_width * ratio)
        new_h = int(img_height * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf
