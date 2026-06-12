from PIL import Image
import os
for f in ["152_0.png", "152_1.png"]:
    path = f"/home/ClashRoyale/public/assets/sc/chr_knight_tex/{f}"
    if os.path.exists(path):
        img = Image.open(path)
        print(f"Image {f}: size {img.size}, bbox: {img.getbbox()}")
