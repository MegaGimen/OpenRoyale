import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';

const game = new Game();
game.start();

const gk = game.addEntity(Cards.golden_knight, 'blue', new Vector2(9, 20));
const skel1 = game.addEntity({ ...Cards.skeletons, spawnCount: 1 }, 'red', new Vector2(9, 15));
const tower = game.entities.find(e => e.team === 'red' && e.stats.id === 'princess_tower');

gk.useAbility();

for (let i = 0; i < 60; i++) {
    game.update(1/60);
}

console.log(`GK Hit: Skel HP=${skel1.hp}, Tower HP=${tower?.hp}`);
for (const e of game.entities) {
    if (e.team === 'red') {
        console.log(`${e.stats.id} at (${e.pos.x.toFixed(2)}, ${e.pos.y.toFixed(2)}) has HP ${e.hp}`);
    }
}
