import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';

const game = new Game();
game.start();

const knight = game.addEntity(Cards.knight, 'blue', new Vector2(3, 27));

let time = 0;
const dt = 1/60;

for (let i = 0; i < 600; i++) {
    game.update(dt);
    time += dt;
    if (i % 60 === 0) {
        console.log(`Time ${time.toFixed(2)}: X=${knight.pos.x.toFixed(4)}, Y=${knight.pos.y.toFixed(4)}`);
    }
}
