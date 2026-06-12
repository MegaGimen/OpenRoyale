import os, json
parts_dict = {}
sc_dir = "/home/ClashRoyale/public/assets/sc"
for root, dirs, files in os.walk(sc_dir):
    if not root.endswith("_tex"): continue
    char_name = os.path.basename(root)
    parts_dict[char_name] = {}
    
    for f in files:
        if not f.endswith(".png"): continue
        parts = f.replace(".png", "").split("_")
        if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
            shape_id = parts[0]
            part_idx = int(parts[1])
            if shape_id not in parts_dict[char_name]:
                parts_dict[char_name][shape_id] = part_idx + 1
            else:
                parts_dict[char_name][shape_id] = max(parts_dict[char_name][shape_id], part_idx + 1)

with open(os.path.join(sc_dir, "shape_parts.json"), "w") as out:
    json.dump(parts_dict, out, indent=2)
print("Done!")
