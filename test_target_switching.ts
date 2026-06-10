import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';

const game = new Game();
// Do not start game so towers aren't spawned.
// We just want to test entity-to-entity target switching.

// Blue Knight at (10, 10).
const knight = game.addEntity(Cards.knight, 'blue', new Vector2(10, 10));

// Red Giant at (10, 15). Knight will target Giant first since it's within sightRange (5.5).
const giant = game.addEntity(Cards.giant, 'red', new Vector2(10, 15));

console.log(`Knight target at frame 0: ${knight.target?.stats.name || 'None'}`);

for (let i = 0; i < 60; i++) {
    game.update(1/60);
}

console.log(`Knight target at frame 60: ${knight.target?.stats.name || 'None'} (Dist to target: ${knight.target ? knight.pos.distanceTo(knight.target.pos) : 'N/A'})`);

// Spawn Red Skeletons at (10, 12). Closer than Giant!
const skeletons = game.addEntity(Cards.skeletons, 'red', new Vector2(10, 12));
console.log('Spawned skeletons at (10, 12)');

game.update(1/60);
console.log(`Knight target immediately after spawn: ${knight.target?.stats.name || 'None'}`);
