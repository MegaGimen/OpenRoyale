import { Game } from './src/engine/Game';
import { Cards } from './src/engine/Cards';
import { Vector2 } from './src/engine/Vector2';

function runTest(testName: string, testFn: () => boolean) {
    console.log(`\n--- Running Test: ${testName} ---`);
    try {
        const success = testFn();
        if (success) {
            console.log(`✅ PASS: ${testName}`);
        } else {
            console.error(`❌ FAIL: ${testName}`);
        }
    } catch (e) {
        console.error(`❌ ERROR: ${testName}\n`, e);
    }
}

function testArcherQueenCloak() {
    const game = new Game();
    game.start();
    
    const aq = game.addEntity(Cards.archer_queen, 'blue', new Vector2(9, 20));
    const knight = game.addEntity(Cards.knight, 'red', new Vector2(9, 18));
    
    // Knight should target AQ
    game.update(1/60);
    if (knight.target !== aq) return false;
    
    // Activate cloak
    aq.useAbility();
    game.update(1/60);
    
    // Knight should drop target
    if (knight.target === aq) return false;
    
    return true;
}

function testAggroStickiness() {
    const game = new Game();
    game.start();
    
    const pekka = game.addEntity(Cards.pekka, 'blue', new Vector2(9, 20));
    const giant = game.addEntity(Cards.giant, 'red', new Vector2(9, 16));
    
    // PEKKA targets Giant
    game.update(1/60);
    if (pekka.target !== giant) return false;
    
    // Spawn skeletons closer, but not nudging PEKKA
    const skels = game.addEntity(Cards.skeletons, 'red', new Vector2(7, 19));
    
    // PEKKA should STILL target giant
    game.update(1/60);
    if (pekka.target !== giant) return false;
    
    return true;
}

function testAggroNudge() {
    const game = new Game();
    game.start();
    
    const pekka = game.addEntity(Cards.pekka, 'blue', new Vector2(9, 20));
    const giant = game.addEntity(Cards.giant, 'red', new Vector2(9, 16));
    
    // PEKKA targets Giant
    game.update(1/60);
    if (pekka.target !== giant) return false;
    
    // Spawn skeleton EXACTLY on PEKKA to nudge it
    const skel = game.addEntity({ ...Cards.skeletons, spawnCount: 1 }, 'red', new Vector2(9, 20.1));
    
    // PEKKA gets nudged, clears target, and retargets to closest (Skel)
    game.update(1/60);
    game.update(1/60);
    
    if (pekka.target !== skel && pekka.target?.stats.id !== 'skeletons') return false;
    
    return true;
}

function testGoldenKnightDash() {
    const game = new Game();
    game.start();
    
    const gk = game.addEntity(Cards.golden_knight, 'blue', new Vector2(9, 18));
    const skel1 = game.addEntity({ ...Cards.skeletons, spawnCount: 1 }, 'red', new Vector2(9, 14));
    
    gk.useAbility();
    
    // Update enough frames for dash to hit
    for (let i = 0; i < 60; i++) {
        game.update(1/60);
    }
    
    // GK should have teleported across river to skel1
    if (gk.pos.distanceTo(new Vector2(9, 14)) > 2) return false;
    
    return true;
}

function testSwarmPathing() {
    const game = new Game();
    game.start();
    
    // Spawn 15 skeletons behind left Princess Tower
    const army = game.addEntity({ ...Cards.skeletons, spawnCount: 15, spawnRadius: 1.5 }, 'blue', new Vector2(3, 27));
    
    // Remove red towers so they don't kill the skeletons
    game.entities = game.entities.filter(e => e.team === 'blue');
    
    // Run for 15 seconds
    for (let i = 0; i < 900; i++) {
        game.update(1/60);
    }
    
    // Check if they successfully crossed the river
    let crossedCount = 0;
    for (const e of game.entities) {
        if (e.team === 'blue' && e.stats.id === 'skeletons' && e.pos.y < 15) {
            crossedCount++;
        }
    }
    
    // At least most of them should have crossed
    if (crossedCount < 10) return false;
    
    return true;
}

runTest('Archer Queen Cloak', testArcherQueenCloak);
runTest('Aggro Stickiness', testAggroStickiness);
runTest('Aggro Nudge Retargeting', testAggroNudge);
runTest('Golden Knight Dash', testGoldenKnightDash);
runTest('Swarm Pathing', testSwarmPathing);
