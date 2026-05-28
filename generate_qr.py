import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from PIL import Image, ImageDraw, ImageFont
import os

def create_qr():
    qr = qrcode.QRCode(
        version=5, 
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20,
        border=2,
    )
    qr.add_data("https://gkkintern.in")
    qr.make(fit=True)

    # Create styled image
    qr_img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(radius_ratio=1)
    ).convert('RGBA')

    # Now add text "GKK INTERN" in the middle
    width, height = qr_img.size
    draw = ImageDraw.Draw(qr_img)

    # Rectangle size
    rect_width = width * 0.5
    rect_height = height * 0.18

    x0 = (width - rect_width) / 2
    y0 = (height - rect_height) / 2
    x1 = (width + rect_width) / 2
    y1 = (height + rect_height) / 2

    # Draw white rounded rectangle
    draw.rounded_rectangle([x0, y0, x1, y1], radius=20, fill="white")

    # Try loading a bold system font, fallback to standard or default
    font = None
    font_sizes = [int(rect_height * 0.55), int(rect_height * 0.5), int(rect_height * 0.4)]
    
    for size in font_sizes:
        try:
            # Try to load Windows font
            font = ImageFont.truetype("arialbd.ttf", size)
            break
        except Exception:
            try:
                font = ImageFont.truetype("segoeuib.ttf", size)
                break
            except Exception:
                pass
                
    if not font:
        font = ImageFont.load_default()

    text = "GKK INTERN"
    
    # Calculate text position to center it
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_w = right - left
    text_h = bottom - top

    text_x = (width - text_w) / 2
    text_y = (height - text_h) / 2 - top/2

    # Draw shadow/offset for text pop (optional)
    draw.text((text_x, text_y), text, fill=(15, 23, 42), font=font) # Dark navy color for brand

    # Save to workspace
    workspace_path = "D:\\WEBSITES BUILT\\Gkk-hire\\gkk_intern_qr.png"
    qr_img.save(workspace_path)
    
    # Save to artifacts so it can be previewed in chat
    artifacts_dir = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5b5e4ef8-6e35-4121-840c-1919f78f5966\\artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    artifacts_path = os.path.join(artifacts_dir, "gkk_intern_qr_view.png")
    qr_img.save(artifacts_path)
    
    print(f"Artifacts path: {artifacts_path}")
    print(f"Workspace path: {workspace_path}")

create_qr()
