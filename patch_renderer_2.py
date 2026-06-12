import re

with open("src/engine/SCRenderer.ts", "r") as f:
    content = f.read()

pattern = re.compile(r"const p0 = part\.points\[0\];\s*const p1 = part\.points\[1\];\s*const p2 = part\.points\[2\];")

replacement = """const imgW = part.is_normalized ? img.width : 1;
                const imgH = part.is_normalized ? img.height : 1;
                const p0 = { x: part.points[0].x, y: part.points[0].y, u: part.points[0].u * imgW, v: part.points[0].v * imgH };
                const p1 = { x: part.points[1].x, y: part.points[1].y, u: part.points[1].u * imgW, v: part.points[1].v * imgH };
                const p2 = { x: part.points[2].x, y: part.points[2].y, u: part.points[2].u * imgW, v: part.points[2].v * imgH };"""

content = pattern.sub(replacement, content)

# I also need to update the part.points loop
pattern2 = re.compile(r"ctx\.beginPath\(\);\s*ctx\.moveTo\(part\.points\[0\]\.u, part\.points\[0\]\.v\);\s*for \(let i = 1; i < part\.points\.length; i\+\+\) \{\s*ctx\.lineTo\(part\.points\[i\]\.u, part\.points\[i\]\.v\);\s*\}")

replacement2 = """ctx.beginPath();
                ctx.moveTo(part.points[0].u * imgW, part.points[0].v * imgH);
                for (let i = 1; i < part.points.length; i++) {
                    ctx.lineTo(part.points[i].u * imgW, part.points[i].v * imgH);
                }"""

content = re.sub(pattern2, replacement2, content)

with open("src/engine/SCRenderer.ts", "w") as f:
    f.write(content)

