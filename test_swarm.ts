import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';

const game = new Game();
game.start();

const army = game.addEntity({ ...Cards.skeletons, spawnCount: 15, spawnRadius: 1.5 }, 'blue', new Vector2(3, 27));

game.entities = game.entities.filter(e => e.team === 'blue');

for (let i = 0; i < 900; i++) {
    game.update(1/60);
}

let crossedCount = 0;
for (const e of game.entities) {
    if (e.team === 'blue' && e.stats.id === 'skeletons') {
        console.log(`Skeleton at X=${e.pos.x.toFixed(2)}, Y=${e.pos.y.toFixed(2)}`);
        if (e.pos.y < 15) crossedCount++;
    }
}
console.log(`Crossed: ${crossedCount}`);
