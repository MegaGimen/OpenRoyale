const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/assets/sc/chr_princess.json'));
const keys = Object.keys(data.exports);
console.log('Includes idle:', keys.includes('princess_tower_red_idle1_8'));
console.log('Includes attack:', keys.includes('princess_tower_red_attack1_8'));
