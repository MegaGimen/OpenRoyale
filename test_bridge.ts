import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';
import { CONFIG } from './src/engine/config';

const game = new Game();
game.start();

// Spawn a Knight on Red team right next to the bridge boundary
const knight = game.addEntity(Cards.knight, 'red', new Vector2(2.5, 14.5));

// Enemy tower is at (3, 25)
let time = 0;
const dt = 1/60;

for (let i = 0; i < 300; i++) {
    game.update(dt);
    time += dt;
    if (i % 30 === 0) {
        console.log(`Time ${time.toFixed(2)}: X=${knight.pos.x.toFixed(4)}, Y=${knight.pos.y.toFixed(4)}`);
    }
}
