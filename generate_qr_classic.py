import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

def create_classic_qr():
    qr = qrcode.QRCode(
        version=5, 
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=3,
    )
    qr.add_data("https://gkkintern.in")
    qr.make(fit=True)

    # Use default square blocks - 100% universal scannability
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGBA')

    width, height = qr_img.size
    draw = ImageDraw.Draw(qr_img)

    # White box in the middle to house the text cleanly without destroying too many data clusters
    rect_width = width * 0.45
    rect_height = height * 0.15

    x0 = (width - rect_width) / 2
    y0 = (height - rect_height) / 2
    x1 = (width + rect_width) / 2
    y1 = (height + rect_height) / 2

    # Provide a crisp solid white background for the text
    draw.rectangle([x0, y0, x1, y1], fill="white")

    # Font handling
    font = None
    try:
        font = ImageFont.truetype("arialbd.ttf", int(rect_height * 0.55))
    except:
        font = ImageFont.load_default()

    text = "GKK INTERN"
    
    # Text fitting and drawing
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_w = right - left
    text_h = bottom - top

    text_x = (width - text_w) / 2
    text_y = (height - text_h) / 2 - top/2

    draw.text((text_x, text_y), text, fill="black", font=font)

    # Save to workspace
    workspace_path = "D:\\WEBSITES BUILT\\Gkk-hire\\gkk_classic_scannable_qr.png"
    qr_img.save(workspace_path)
    
    # Save to artifacts so it can be previewed in chat
    artifacts_dir = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5b5e4ef8-6e35-4121-840c-1919f78f5966\\artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    artifacts_path = os.path.join(artifacts_dir, "gkk_classic_scannable_qr_view.png")
    qr_img.save(artifacts_path)
    print(f"Artifacts path: {artifacts_path}")

create_classic_qr()
