import { Game } from './engine/Game';
import { Vector2 } from './engine/Vector2';

console.log("Starting Headless Simulation: Evo Skeletons");

const game = new Game();
game.start();

// Spawn a Giant for them to hit so they live long enough to spawn
const giant = game.addEntityById('giant', 'red', new Vector2(9, 16));
if (giant) giant.hp = 10000; // lots of HP

// Spawn Evo Skeletons
const skeletons = game.addEntityById('evo_skeletons', 'blue', new Vector2(9, 18));
const cloneGroupId = game.entities[game.entities.length - 1].cloneGroupId;

console.log("Initial state:");
console.log(`Evo Skeletons group size: ${game.entities.filter(e => e.cloneGroupId === cloneGroupId).length}`);

const dt = 1 / 60;
const simulateSeconds = 5;
const totalFrames = simulateSeconds * 60;

for (let i = 0; i <= totalFrames; i++) {
    game.update(dt);
    
    // Log every 1 second
    if (i % 60 === 0) {
        const count = game.entities.filter(e => e.cloneGroupId === cloneGroupId && e.hp > 0).length;
        console.log(`Time: ${i / 60}s | Skeleton count: ${count}`);
    }
}

console.log("Simulation finished.");
