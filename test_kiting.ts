import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';

const game = new Game();
game.start();

// Red PEKKA has crossed the bridge
const pekka = game.addEntity(Cards.pekka, 'red', new Vector2(4, 18));

// Blue Giant on the right side of the river
const giant = game.addEntity(Cards.giant, 'blue', new Vector2(10, 18));

let time = 0;
const dt = 1/60;

for (let i = 0; i < 600; i++) {
    game.update(dt);
    time += dt;
    if (i % 30 === 0) {
        console.log(`Time ${time.toFixed(2)}: PEKKA at X=${pekka.pos.x.toFixed(2)}, Y=${pekka.pos.y.toFixed(2)} | Target: ${pekka.target?.stats.name || 'None'} | Giant X=${giant.pos.x.toFixed(2)}, Y=${giant.pos.y.toFixed(2)}`);
    }
}
