import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';

const game = new Game();
game.start(); // Spawns towers

// Red Knight at (17, 10) targeting Princess Tower at (15, 25)
const knight = game.addEntity(Cards.knight, 'red', new Vector2(17, 10));

console.log(`Knight Initial Pos: ${knight.pos.x.toFixed(2)}, ${knight.pos.y.toFixed(2)}`);

for (let i = 0; i < 600; i++) {
    game.update(1/60);
    if (i % 30 === 0) {
        console.log(`Frame ${i}: X=${knight.pos.x.toFixed(2)}, Y=${knight.pos.y.toFixed(2)}, Path=${knight.pathPoints.map(p => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(' -> ')}`);
    }
}
