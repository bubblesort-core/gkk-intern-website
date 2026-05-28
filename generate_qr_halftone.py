import qrcode
from PIL import Image, ImageDraw
import os

PIXEL_FONT = {
    'G': [" .XX. ", " X..X ", " X... ", " X.XX ", " .XX. "],
    'K': [" X..X ", " X.X. ", " XX.. ", " X.X. ", " X..X "],
    'I': [" XXX ", " .X. ", " .X. ", " .X. ", " XXX "],
    'N': [" X..X ", " XX.X ", " X.XX ", " X..X ", " X..X "],
    'T': [" XXX ", " .X. ", " .X. ", " .X. ", " .X. "],
    'E': [" XXX ", " X.. ", " XXX ", " X.. ", " XXX "],
    'R': [" XXX. ", " X..X ", " XXX. ", " X.X. ", " X..X "]
}

def draw_string_to_grid(s):
    lines = ["", "", "", "", ""]
    for char in s:
        pattern = PIXEL_FONT.get(char, ["....", "....", "....", "....", "...."])
        for i in range(5):
            lines[i] += pattern[i]
    return lines

def is_finder(r, c, modules):
    if r < 7 and c < 7: return True
    if r < 7 and c >= modules - 7: return True
    if r >= modules - 7 and c < 7: return True
    return False

def generate_ghost_halftone_qr():
    qr = qrcode.QRCode(
        version=6,  
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=1,
        border=3,
    )
    qr.add_data("https://gkkintern.in")
    qr.make(fit=True)
    matrix = qr.get_matrix()
    modules = len(matrix)
    
    line1 = draw_string_to_grid("GKK")
    line2 = draw_string_to_grid("INTERN")
    l1_width = len(line1[0])
    l2_width = len(line2[0])
    center_r = modules // 2
    center_c = modules // 2
    start_r = center_r - 6
    l1_start_c = center_c - (l1_width // 2)
    l2_start_c = center_c - (l2_width // 2)

    # Track which dots belong to the text
    text_dots = set()
    
    # Inject text into QR
    for i in range(5):
        for j, val in enumerate(line1[i]):
            if val == 'X':
                r = start_r + i
                c = l1_start_c + j
                matrix[r][c] = True
                text_dots.add((r, c))
            elif val == '.' or val == ' ':
                # Clear background around text to make it pop
                r = start_r + i
                c = l1_start_c + j
                matrix[r][c] = False

    start_r_l2 = start_r + 7
    for i in range(5):
        for j, val in enumerate(line2[i]):
            if val == 'X':
                r = start_r_l2 + i
                c = l2_start_c + j
                matrix[r][c] = True
                text_dots.add((r, c))
            elif val == '.' or val == ' ':
                r = start_r_l2 + i
                c = l2_start_c + j
                matrix[r][c] = False

    cell_size = 20
    img_size = modules * cell_size
    img = Image.new('RGBA', (img_size, img_size), 'white')
    draw = ImageDraw.Draw(img)
    
    for r in range(modules):
        for c in range(modules):
            if matrix[r][c]:
                x = c * cell_size
                y = r * cell_size
                
                if (r, c) in text_dots:
                    # Huge bold dots for the text
                    draw.ellipse([x-2, y-2, x+cell_size+2, y+cell_size+2], fill=(15, 23, 42))
                elif is_finder(r, c, modules):
                    # Standard dots for finders to ensure scanning
                    draw.rounded_rectangle([x, y, x+cell_size, y+cell_size], radius=4, fill=(15, 23, 42))
                else:
                    # Tiny tiny dots for background data, so it visually fades out
                    # leaving only the text visible to human eyes
                    center_x = x + cell_size/2
                    center_y = y + cell_size/2
                    tiny_radius = 3
                    draw.ellipse([center_x-tiny_radius, center_y-tiny_radius, center_x+tiny_radius, center_y+tiny_radius], fill=(200, 205, 215))

    workspace_path = "D:\\WEBSITES BUILT\\Gkk-hire\\gkk_halftone_qr.png"
    img.save(workspace_path)
    
    artifacts_dir = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5b5e4ef8-6e35-4121-840c-1919f78f5966\\artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    artifacts_path = os.path.join(artifacts_dir, "gkk_halftone_qr_view.png")
    img.save(artifacts_path)
    
    print(f"Artifacts path: {artifacts_path}")

generate_ghost_halftone_qr()
