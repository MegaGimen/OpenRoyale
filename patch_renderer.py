import re

with open("src/engine/SCRenderer.ts", "r") as f:
    content = f.read()

pattern = re.compile(r"if \(action === 'KingTower_red'\) mcId = data.exports\['KingTower_red'\];")
replacement = """if (action === 'KingTower_red') mcId = data.exports['KingTower_red'];
        if (action === 'StarTower_base_blue') mcId = data.exports['StarTower_base_blue'];"""

content = pattern.sub(replacement, content)

with open("src/engine/SCRenderer.ts", "w") as f:
    f.write(content)

