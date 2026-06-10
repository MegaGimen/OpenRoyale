import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';

const game = new Game();
game.start();

// "I placed a Knight on the left edge of the blue bridge"
const knight = game.addEntity(Cards.knight, 'blue', new Vector2(2.0, 18.0));

let time = 0;
const dt = 1/60;

for (let i = 0; i < 300; i++) {
    game.update(dt);
    time += dt;
    if (i % 30 === 0) {
        console.log(`Time ${time.toFixed(2)}: X=${knight.pos.x.toFixed(4)}, Y=${knight.pos.y.toFixed(4)}`);
    }
}
