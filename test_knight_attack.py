import json
with open('public/assets/sc/knight_mapping.json') as f:
    mapping = json.load(f)

anim = mapping.get('Knight_attack1_6')
if anim:
    print(f"Frames: {anim['frames']}")
    print(f"Shapes len: {len(anim['shapes'])}")
    for i, s in enumerate(anim['shapes']):
        print(f"Frame {i}: {s}")
