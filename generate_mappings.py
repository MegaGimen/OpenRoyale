import json
import os

mappings = {
    "chr_knight": {
        "Idle_Down": [60, 71],
        "Walk_Down": [0, 11],
        "Walk_DownRight": [12, 23],
        "Walk_Right": [24, 35],
        "Walk_UpRight": [36, 47],
        "Walk_Up": [48, 59],
        "Walk_Down_red": [120, 131],
        "Walk_DownRight_red": [132, 143],
        "Walk_Right_red": [144, 155],
        "Walk_UpRight_red": [156, 167],
        "Walk_Up_red": [168, 179],
        "Attack_Down": [240, 263],
        "Attack_DownRight": [264, 287],
        "Attack_Right": [288, 311],
        "Attack_UpRight": [312, 335],
        "Attack_Up": [336, 359],
        "Attack_Down_red": [360, 383],
        "Attack_DownRight_red": [384, 407],
        "Attack_Right_red": [408, 431],
        "Attack_UpRight_red": [432, 455],
        "Attack_Up_red": [456, 479]
    },
    "chr_archer": {
        "Idle_Down": [0, 0],
        "Walk_Down": [0, 11],
        "Walk_DownRight": [12, 23],
        "Walk_Right": [24, 35],
        "Walk_UpRight": [36, 47],
        "Walk_Up": [48, 59],
        "Attack_Up": [60, 71],
        "Attack_UpRight": [72, 83],
        "Attack_Right": [84, 95],
        "Attack_DownRight": [96, 107],
        "Attack_Down": [108, 119],
        "Walk_Down_red": [120, 131],
        "Walk_DownRight_red": [132, 143],
        "Walk_Right_red": [144, 155],
        "Walk_UpRight_red": [156, 167],
        "Walk_Up_red": [168, 179],
        "Attack_Up_red": [180, 191],
        "Attack_UpRight_red": [192, 203],
        "Attack_Right_red": [204, 215],
        "Attack_DownRight_red": [216, 227],
        "Attack_Down_red": [228, 239]
    },
    "chr_giant": {
        "Idle_Down": [48, 59],
        "Walk_Up": [0, 11],
        "Walk_UpRight": [12, 23],
        "Walk_Right": [24, 35],
        "Walk_DownRight": [36, 47],
        "Walk_Down": [48, 59],
        "Attack_Up": [60, 95],
        "Attack_UpRight": [96, 131],
        "Attack_Right": [132, 167],
        "Attack_DownRight": [168, 203],
        "Attack_Down": [204, 239],
        "Walk_Down_red": [240, 251],
        "Walk_DownRight_red": [252, 263],
        "Walk_Right_red": [264, 275],
        "Walk_UpRight_red": [276, 287],
        "Walk_Up_red": [288, 299],
        "Attack_Up_red": [300, 335],
        "Attack_UpRight_red": [336, 371],
        "Attack_Right_red": [372, 407],
        "Attack_DownRight_red": [408, 443],
        "Attack_Down_red": [444, 467]
    }
}

for char_name, anims in mappings.items():
    out_path = f"/home/ClashRoyale/cr-assets-png/assets/sc/{char_name}_mapping.json"
    with open(out_path, "w") as f:
        json.dump({"animations": anims}, f, indent=4)
    print(f"Generated {out_path}")
