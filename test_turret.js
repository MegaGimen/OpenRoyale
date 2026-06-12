const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/assets/sc/building_tower.json'));
const mc = data.movieclips['179'];
for (let i = 0; i < 36; i++) {
    const frame = mc.frames[i];
    // check matrix or position
    // actually, let's just use playwright to render frame 0 and frame 18 and frame 35
}
