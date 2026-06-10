import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';
import { CONFIG } from './src/engine/config';

const game = new Game();
// Clear towers for clean test
game.entities = [];
game.projectiles = [];

// Add Knight
const knight = game.addEntity(Cards.knight, 'red', new Vector2(10, 15));

// Add Evo Skeletons
game.addEntity(Cards.evo_skeletons, 'blue', new Vector2(10, 16));

let dt = 1 / 60;
let time = 0;

console.log(`Time 0: Knight HP = ${knight.hp}`);

for (let i = 0; i < 300; i++) { // 5 seconds
    game.update(dt);
    time += dt;

    if (knight.hp <= 0) {
        console.log(`Time ${time.toFixed(2)}: Knight died!`);
        break;
    }
}

console.log(`Time ${time.toFixed(2)}: Test ended. Knight HP: ${knight.hp}`);
console.log(`Total entities on field: ${game.entities.length}`);
for (const e of game.entities) {
    console.log(`- ${e.stats.name} (HP: ${e.hp}) [Group: ${e.cloneGroupId}]`);
}
