import os
from PIL import Image

def analyze_character(char_name):
    dir_path = f"/home/ClashRoyale/cr-assets-png/assets/sc/{char_name}_out"
    files = sorted([f for f in os.listdir(dir_path) if f.endswith('.png')])
    
    images = []
    print(f"Loading {len(files)} images for {char_name}...")
    for f in files:
        img = Image.open(os.path.join(dir_path, f))
        alpha = img.getchannel('A') if 'A' in img.getbands() else None
        if alpha:
            bbox = alpha.getbbox() # (left, upper, right, lower)
            if bbox:
                area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                images.append((f, bbox[2]-bbox[0], bbox[3]-bbox[1], area))
            else:
                images.append((f, 0, 0, 0))
        else:
            images.append((f, 0, 0, 0))
            
    boundaries = [0]
    for i in range(1, len(images)):
        prev = images[i-1]
        curr = images[i]
        
        area_change = abs(curr[3] - prev[3]) / max(prev[3], 1)
        if area_change > 0.25:
            boundaries.append(i)
            
    boundaries.append(len(images))
    print(f"Detected {len(boundaries)-1} potential animation blocks:")
    for i in range(len(boundaries)-1):
        start = boundaries[i]
        end = boundaries[i+1] - 1
        print(f"Block {i}: frames {start} to {end} (Length: {end-start+1})")

analyze_character('chr_knight')
