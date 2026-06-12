import json
with open('public/assets/sc/building_tower_mapping.json') as f:
    m = json.load(f)
for k in ['unknown_177', 'unknown_181']:
    if k in m:
        print(f"{k} frames: {m[k]['frames']}")
