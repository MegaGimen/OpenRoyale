import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_summary(char_name):
    dir_path = f"/home/ClashRoyale/cr-assets-png/assets/sc/{char_name}_out"
    files = sorted([f for f in os.listdir(dir_path) if f.endswith('.png')])
    
    # We will just sample every 4th frame to get an overview without being overwhelming
    sampled_files = files[::4]
    
    # Create a giant grid
    cols = 10
    rows = math.ceil(len(sampled_files) / cols)
    
    # Assume max width/height per sprite is ~150px
    cell_w, cell_h = 120, 120
    
    grid = Image.new('RGBA', (cols * cell_w, rows * cell_h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(grid)
    
    for idx, f in enumerate(sampled_files):
        img_path = os.path.join(dir_path, f)
        img = Image.open(img_path)
        img.thumbnail((cell_w - 20, cell_h - 20)) # scale down
        
        r = idx // cols
        c = idx % cols
        
        x = c * cell_w
        y = r * cell_h
        
        grid.paste(img, (x + 10, y + 10), img if 'A' in img.getbands() else None)
        
        # Draw frame number
        frame_num = int(f.split('_')[-1].split('.')[0])
        draw.text((x + 5, y + 5), str(frame_num), fill=(0,0,0,255))

    grid.save(f"/home/ClashRoyale/{char_name}_summary.png")
    print(f"Saved {char_name}_summary.png")

create_summary('chr_knight')
