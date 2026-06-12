import json
with open('public/assets/sc/chr_knight_shapes.json') as f:
    shapes = json.load(f)

for shape_id in [111, 401, 414]:
    if str(shape_id) in shapes:
        print(f"Shape {shape_id} parts count: {len(shapes[str(shape_id)])}")
