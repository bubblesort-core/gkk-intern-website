import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

def generate_text_qr():
    qr = qrcode.QRCode(
        version=3, # Smaller version keeps it cleaner and words larger relative to size
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=1,
        border=3,
    )
    qr.add_data("https://gkkintern.in")
    qr.make(fit=True)
    matrix = qr.get_matrix()
    
    modules = len(matrix)
    cell_size = 60  # use large cell for text visibility
    img_size = modules * cell_size
    
    # White background with enough padding
    img = Image.new('RGBA', (img_size, img_size), 'white')
    draw = ImageDraw.Draw(img)
    
    # Setup fonts
    try:
        # A bold, clean font works best for tiny QR text
        font_gkk = ImageFont.truetype("arialbd.ttf", 26)
        font_intern = ImageFont.truetype("arialbd.ttf", 16)
    except:
        font_gkk = ImageFont.load_default()
        font_intern = ImageFont.load_default()
    
    # We must keep finder patterns solid to guarantee 100% scanning success
    def is_finder(r, c):
        # Top-left
        if r < 7 and c < 7: return True
        # Top-right
        if r < 7 and c >= modules - 7: return True
        # Bottom-left
        if r >= modules - 7 and c < 7: return True
        return False

    def is_alignment(r, c):
        # Rough check to keep alignment patterns solid if they exist.
        # Version 3 alignment pattern is centered at (22, 22)
        # Size is 5x5
        if modules > 21:
            if 20 <= r <= 24 and 20 <= c <= 24:
                return True
        return False

    for r in range(modules):
        for c in range(modules):
            if matrix[r][c]:
                x = c * cell_size
                y = r * cell_size
                
                if is_finder(r, c) or is_alignment(r, c):
                    # Solid rounded blocks for alignment/finder patterns
                    draw.rounded_rectangle([x+1, y+1, x+cell_size-1, y+cell_size-1], radius=15, fill=(15, 23, 42))
                else:
                    # Text for data modules
                    draw.text((x + 5, y + 8), "GKK", fill=(15, 23, 42), font=font_gkk)
                    draw.text((x + 2, y + 36), "INTERN", fill=(15, 23, 42), font=font_intern)
    
    workspace_path = "D:\\WEBSITES BUILT\\Gkk-hire\\gkk_text_dots_qr.png"
    img.save(workspace_path)
    
    artifacts_dir = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5b5e4ef8-6e35-4121-840c-1919f78f5966\\artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    artifacts_path = os.path.join(artifacts_dir, "gkk_text_dots_view.png")
    img.save(artifacts_path)
    print(f"Artifacts path: {artifacts_path}")

generate_text_qr()
