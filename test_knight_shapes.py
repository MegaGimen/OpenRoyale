import json
with open('public/assets/sc/chr_knight_shapes.json') as f:
    shapes = json.load(f)
with open('public/assets/sc/knight_mapping.json') as f:
    mapping = json.load(f)

for anim in ['Knight_run1_6', 'Knight_enemy_run1_6']:
    if anim in mapping:
        shape_id = mapping[anim]['shapes'][0]
        print(f"--- {anim} frame 0 shape: {shape_id} ---")
        if str(shape_id) in shapes:
            parts = shapes[str(shape_id)]
            for p in parts:
                print(p)
