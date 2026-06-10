import { Game } from './engine/Game';
import { Cards } from './engine/Cards';
import { Vector2 } from './engine/Vector2';

console.log("Starting Headless Simulation...");

const game = new Game();
game.start();

console.log("Towers spawned:");
for (const e of game.entities) {
    console.log(`- ${e.team} ${e.stats.name} at (${e.pos.x}, ${e.pos.y}) HP: ${e.hp}`);
}

// Spawn a Blue Knight
const knight = game.addEntityById('knight', 'blue', new Vector2(9, 25));
if (!knight) {
    console.error("Failed to spawn knight");
    process.exit(1);
}
console.log(`Spawned Blue Knight at (${knight.pos.x}, ${knight.pos.y})`);

const dt = 1 / 60; // 60 FPS
const simulateSeconds = 10;
const totalFrames = simulateSeconds * 60;

for (let i = 0; i <= totalFrames; i++) {
    game.update(dt);
    
    // Log every 1 second
    if (i % 60 === 0) {
        console.log(`\nTime: ${i / 60}s`);
        console.log(`Knight Pos: (${knight.pos.x.toFixed(2)}, ${knight.pos.y.toFixed(2)}), HP: ${knight.hp}, Target: ${knight.target ? knight.target.stats.name : 'None'}, isMoving: ${knight.isMoving}`);
        
        for (const e of game.entities) {
            if (e.stats.type === 'tower' && e.hp < e.stats.hp) {
                console.log(`${e.team} ${e.stats.name} HP: ${e.hp}/${e.stats.hp}`);
            }
        }
    }
}

console.log("Simulation finished.");
