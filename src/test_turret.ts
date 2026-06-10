import { Game } from './engine/Game';
import { Vector2 } from './engine/Vector2';

console.log("Starting Headless Simulation: Elite Musketeer vs Tower");

const game = new Game();
game.start();

const eliteMusketeer = game.addEntityById('elite_musketeer', 'blue', new Vector2(3, 14));
if (eliteMusketeer) {
    eliteMusketeer.useAbility();
}

const dt = 1 / 60;
const simulateSeconds = 20;
const totalFrames = simulateSeconds * 60;

for (let i = 0; i <= totalFrames; i++) {
    game.update(dt);
    
    // Log every 2 seconds
    if (i % 120 === 0) {
        console.log(`\nTime: ${i / 60}s`);
        const tower = game.entities.find(e => e.stats.id === 'princess_tower' && e.team === 'red' && e.pos.x === 3);
        const turret = game.entities.find(e => e.stats.id === 'elite_turret');
        
        console.log(`Musketeer HP: ${eliteMusketeer ? eliteMusketeer.hp.toFixed(1) : 0}`);
        console.log(`Turret HP: ${turret ? turret.hp.toFixed(1) : 0}`);
        console.log(`Red Princess Tower HP: ${tower ? tower.hp.toFixed(1) : 0}`);
    }
}

console.log("Simulation finished.");
