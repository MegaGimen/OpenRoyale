import { Game } from './engine/Game';
import { Vector2 } from './engine/Vector2';

console.log("Starting Headless Simulation: Elite Abilities");

const game = new Game();
game.start();

const eliteMusketeer = game.addEntityById('elite_musketeer', 'blue', new Vector2(9, 20));

console.log("Initial entities:");
game.entities.forEach(e => {
    if (e.stats.type !== 'tower') console.log(`- ${e.stats.name} at (${e.pos.x.toFixed(2)}, ${e.pos.y.toFixed(2)})`);
});

console.log("\nActivating Elite Musketeer ability...");
eliteMusketeer!.useAbility();

console.log("\nEntities after ability:");
game.entities.forEach(e => {
    if (e.stats.type !== 'tower') console.log(`- ${e.stats.name} at (${e.pos.x.toFixed(2)}, ${e.pos.y.toFixed(2)})`);
});
