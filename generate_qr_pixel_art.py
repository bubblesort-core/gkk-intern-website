import qrcode
from PIL import Image, ImageDraw
import os

# Pixel font 4x5
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

def generate_pixel_text_qr():
    qr = qrcode.QRCode(
        version=6,  # 41x41 to give space for 25-width text
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
    
    # Calculate starting r, c for each line in the matrix
    center_r = modules // 2
    center_c = modules // 2
    
    # We have 12 rows total (5 + 2 + 5). 
    start_r = center_r - 6
    
    l1_start_c = center_c - (l1_width // 2)
    l2_start_c = center_c - (l2_width // 2)

    # We will override the matrix to force our pixels. 
    # To make them stand out, we give them a 1px white border in the matrix.
    # bounding box
    bbox_r1 = start_r - 1
    bbox_r2 = start_r + 12
    bbox_c1 = l2_start_c - 1
    bbox_c2 = l2_start_c + l2_width + 1

    for r in range(modules):
        for c in range(modules):
            if bbox_r1 <= r <= bbox_r2 and bbox_c1 <= c <= bbox_c2:
                # By default, clear it to white (False) to make the text pop
                matrix[r][c] = False
                
    # Now draw line 1
    for i in range(5):
        for j, val in enumerate(line1[i]):
            if val == 'X':
                matrix[start_r + i][l1_start_c + j] = True
                
    # Now draw line 2
    start_r_l2 = start_r + 7
    for i in range(5):
        for j, val in enumerate(line2[i]):
            if val == 'X':
                matrix[start_r_l2 + i][l2_start_c + j] = True
                
    # Now render the matrix using circles
    cell_size = 20
    img_size = modules * cell_size
    img = Image.new('RGBA', (img_size, img_size), 'white')
    draw = ImageDraw.Draw(img)
    
    for r in range(modules):
        for c in range(modules):
            if matrix[r][c]:
                x = c * cell_size
                y = r * cell_size
                
                # Draw rounded dot
                draw.ellipse([x+2, y+2, x+cell_size-2, y+cell_size-2], fill=(15, 23, 42))

    workspace_path = "D:\\WEBSITES BUILT\\Gkk-hire\\gkk_pixel_art_qr.png"
    img.save(workspace_path)
    
    artifacts_dir = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\5b5e4ef8-6e35-4121-840c-1919f78f5966\\artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)
    artifacts_path = os.path.join(artifacts_dir, "gkk_pixel_art_qr_view.png")
    img.save(artifacts_path)
    
    print(f"Artifacts path: {artifacts_path}")

generate_pixel_text_qr()
