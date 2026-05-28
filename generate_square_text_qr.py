import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

def generate_square_text_qr():
    qr = qrcode.QRCode(
        version=5, 
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=1,
        border=3,
    )
    qr.add_data("https://gkkintern.in")
    qr.make(fit=True)
    matrix = qr.get_matrix()
    
    modules = len(matrix)
    cell_size = 20
    img_size = modules * cell_size
    
    # 1. Create the Text Mask
    text_mask = Image.new('L', (img_size, img_size), 0)
    draw_mask = ImageDraw.Draw(text_mask)
    
    try:
        # Use a very thick block font if possible, else standard Arial Bold
        font = ImageFont.truetype("arialbd.ttf", int(img_size / 3.2))
    except:
        font = ImageFont.load_default()
        
    line1, line2, line3 = "GKK", "INT", "ERN"
    
    # Draw the text in a 3x3 grid to fill the whole square
    draw_mask.text((img_size*0.05, img_size*0.0), line1, fill=255, font=font)
    draw_mask.text((img_size*0.05, img_size*0.3), line2, fill=255, font=font)
    draw_mask.text((img_size*0.05, img_size*0.6), line3, fill=255, font=font)
    
    # 2. Render the QR code
    img = Image.new('RGBA', (img_size, img_size), 'white')
    draw = ImageDraw.Draw(img)
    
    def is_finder(r, c):
        if r < 7 and c < 7: return True
        if r < 7 and c >= modules - 7: return True
        if r >= modules - 7 and c < 7: return True
        return False

    for r in range(modules):
        for c in range(modules):
            x = c * cell_size
            y = r * cell_size
            
            # Check if this module is inside the text mask
            center_x = x + cell_size // 2
            center_y = y + cell_size // 2
            in_text = text_mask.getpixel((center_x, center_y)) > 128
            
            if is_finder(r, c):
                # Always draw finder patterns so it scans
                if matrix[r][c]:
                    draw.rectangle([x, y, x+cell_size, y+cell_size], fill=(15, 23, 42))
            else:
                if matrix[r][c] and in_text:
                    # Draw a solid dot because it's a data dot AND inside the text shape
                    draw.ellipse([x+2, y+2, x+cell_size-2, y+cell_size-2], fill=(15, 23, 42))
                # If it's outside the text, we DO NOT DRAW IT. Meaning we skip it.
                # It will be white, destroying that piece of data, relying on error correction.

    workspace_path = "D:\\WEBSITES BUILT\\Gkk-hire\\gkk_square_text_qr.png"
    img.save(workspace_path)
    
    artifacts_dir = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5b5e4ef8-6e35-4121-840c-1919f78f5966\\artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    artifacts_path = os.path.join(artifacts_dir, "gkk_square_text_qr_view.png")
    img.save(artifacts_path)
    
    print(f"Artifacts path: {artifacts_path}")

generate_square_text_qr()
