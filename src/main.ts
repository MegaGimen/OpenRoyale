import './style.css';
import { Game } from './engine/Game';
import { Vector2 } from './engine/Vector2';
import { CONFIG } from './engine/config';
import type { EntityStats } from './engine/Entity';
import { Cards } from './engine/Cards';

const game = new Game();

const baseCards = [Cards.knight, Cards.archers, Cards.giant, Cards.pekka, Cards.musketeer, Cards.hog_rider, Cards.skeletons, Cards.elite_barbarians, Cards.battle_healer];
const evoCards = [Cards.evo_knight, Cards.evo_skeletons];
const championCards = [Cards.golden_knight, Cards.archer_queen];
const eliteCards = [Cards.elite_knight, Cards.elite_musketeer, Cards.elite_giant];

let selectedCard: EntityStats | null = null;
let placementTeam: 'blue' | 'red' = 'blue';

function renderCards(containerId: string, team: 'blue' | 'red') {
    const container = document.getElementById(containerId)!;
    
    const categories = [
        { title: 'Base Cards', cards: baseCards },
        { title: 'Evolutions', cards: evoCards },
        { title: 'Champions', cards: championCards },
        { title: 'Elite Cards', cards: eliteCards }
    ];

    categories.forEach(category => {
        const title = document.createElement('div');
        title.className = 'category-title';
        title.innerText = category.title;
        container.appendChild(title);

        category.cards.forEach(card => {
            const btn = document.createElement('div');
            btn.className = 'card-btn';
            btn.innerText = card.name;
            btn.onclick = () => {
                // Clear selection on both sides
                document.querySelectorAll('.card-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedCard = card;
                placementTeam = team;
            };
            container.appendChild(btn);
        });
    });
}

function setupUI() {
    renderCards('red-cards', 'red');
    renderCards('blue-cards', 'blue');
}

function initRenderer() {
    const container = document.getElementById('game-container')!;
    const pxPerTileX = container.clientWidth / CONFIG.ARENA_WIDTH;
    const pxPerTileY = container.clientHeight / CONFIG.ARENA_HEIGHT;

    // Add River
    const river = document.createElement('div');
    river.style.position = 'absolute';
    river.style.backgroundColor = '#4a90e2';
    river.style.left = '0';
    river.style.top = `${CONFIG.RIVER_Y_START * pxPerTileY}px`;
    river.style.width = '100%';
    river.style.height = `${(CONFIG.RIVER_Y_END - CONFIG.RIVER_Y_START) * pxPerTileY}px`;
    container.appendChild(river);

    // Add Bridges
    [CONFIG.LEFT_BRIDGE_X, CONFIG.RIGHT_BRIDGE_X].forEach(x => {
        const bridge = document.createElement('div');
        bridge.style.position = 'absolute';
        bridge.style.backgroundColor = '#8b5a2b';
        bridge.style.left = `${x * pxPerTileX}px`;
        bridge.style.top = `${CONFIG.RIVER_Y_START * pxPerTileY}px`;
        bridge.style.width = `${CONFIG.BRIDGE_WIDTH * pxPerTileX}px`;
        bridge.style.height = `${(CONFIG.RIVER_Y_END - CONFIG.RIVER_Y_START) * pxPerTileY}px`;
        container.appendChild(bridge);
    });

    // Add SVG overlay for paths
    const pathSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    pathSvg.style.position = 'absolute';
    pathSvg.style.left = '0';
    pathSvg.style.top = '0';
    pathSvg.style.width = '100%';
    pathSvg.style.height = '100%';
    pathSvg.style.pointerEvents = 'none';
    pathSvg.style.zIndex = '5';
    container.appendChild(pathSvg);

    const entityDivs = new Map<number, HTMLDivElement>();
    const pathEls = new Map<number, SVGPolylineElement>();
    const projectileDivs = new Map<number, HTMLDivElement>();
    const abilityBtns = new Map<number, HTMLButtonElement>();
    const redAbilitiesContainer = document.getElementById('red-abilities')!;
    const blueAbilitiesContainer = document.getElementById('blue-abilities')!;

    function render() {
        // Remove dead entities
        const currentIds = new Set(game.entities.map(e => e.id));
        for (const [id, div] of entityDivs.entries()) {
            if (!currentIds.has(id)) {
                div.remove();
                entityDivs.delete(id);
                
                const pathEl = pathEls.get(id);
                if (pathEl) {
                    pathEl.remove();
                    pathEls.delete(id);
                }
            }
        }

        // Projectiles
        const currentProjIds = new Set(game.projectiles.map(p => p.id));
        for (const [id, div] of projectileDivs.entries()) {
            if (!currentProjIds.has(id)) {
                div.remove();
                projectileDivs.delete(id);
            }
        }

        for (const p of game.projectiles) {
            let div = projectileDivs.get(p.id);
            if (!div) {
                div = document.createElement('div');
                div.className = 'projectile';
                div.style.position = 'absolute';
                div.style.width = '8px';
                div.style.height = '8px';
                div.style.borderRadius = '50%';
                div.style.backgroundColor = '#ffaa00';
                div.style.zIndex = '10';
                div.style.transform = 'translate(-50%, -50%)';
                container.appendChild(div);
                projectileDivs.set(p.id, div);
            }
            div.style.left = `${p.pos.x * pxPerTileX}px`;
            div.style.top = `${p.pos.y * pxPerTileY}px`;
        }

        // Update Abilities UI
        const currentAbilityIds = new Set();
        for (const entity of game.entities) {
            if (entity.stats.ability) {
                currentAbilityIds.add(entity.id);
                let btn = abilityBtns.get(entity.id);
                if (!btn) {
                    btn = document.createElement('button');
                    btn.className = 'ability-btn';
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        entity.useAbility();
                    };
                    abilityBtns.set(entity.id, btn);
                    if (entity.team === 'red') redAbilitiesContainer.appendChild(btn);
                    else blueAbilitiesContainer.appendChild(btn);
                }
                
                // Update button state (cooldown)
                if (entity.abilityCooldown > 0) {
                    btn.innerText = `${entity.stats.ability.name} (${entity.abilityCooldown.toFixed(1)}s)`;
                    btn.disabled = true;
                } else {
                    btn.innerText = `Use ${entity.stats.ability.name}`;
                    btn.disabled = false;
                }
            }
        }

        // Remove dead abilities
        for (const [id, btn] of abilityBtns.entries()) {
            if (!currentAbilityIds.has(id)) {
                btn.remove();
                abilityBtns.delete(id);
            }
        }

        // Update/Add entities
        for (const entity of game.entities) {
            let div = entityDivs.get(entity.id);
            if (!div) {
                div = document.createElement('div');
                if (entity.stats.type === 'tower') {
                    div.className = 'tower';
                    div.style.width = `${entity.stats.radius * 2 * pxPerTileX}px`;
                    div.style.height = `${entity.stats.radius * 2 * pxPerTileY}px`;

                    const hpText = document.createElement('div');
                    hpText.className = 'tower-hp-text';
                    hpText.style.position = 'absolute';
                    hpText.style.top = '50%';
                    hpText.style.left = '50%';
                    hpText.style.transform = 'translate(-50%, -50%)';
                    hpText.style.color = 'white';
                    hpText.style.fontWeight = 'bold';
                    hpText.style.fontSize = '12px';
                    hpText.style.textShadow = '1px 1px 2px black';
                    hpText.style.zIndex = '5';
                    div.appendChild(hpText);
                } else {
                    div.className = 'entity';
                    div.style.width = `${entity.stats.radius * 2 * pxPerTileX}px`;
                    div.style.height = `${entity.stats.radius * 2 * pxPerTileY}px`;
                    // Cursor pointer for abilities
                    if (entity.stats.ability) {
                        div.style.cursor = 'pointer';
                        div.style.border = '2px solid gold';
                    }
                }
                div.style.backgroundColor = entity.team === 'blue' ? '#3498db' : '#e74c3c';
                
                // HP Bar
                const hpContainer = document.createElement('div');
                hpContainer.className = 'hp-bar-container';
                const hpBar = document.createElement('div');
                hpBar.className = 'hp-bar';
                hpContainer.appendChild(hpBar);
                div.appendChild(hpContainer);

                container.appendChild(div);
                entityDivs.set(entity.id, div);
            }

            // Update pos
            div.style.left = `${entity.pos.x * pxPerTileX}px`;
            div.style.top = `${entity.pos.y * pxPerTileY}px`;

            // Hog rider jump visual scale
            if (entity.stats.jumpsRiver) {
                if (entity.pos.y >= CONFIG.RIVER_Y_START && entity.pos.y <= CONFIG.RIVER_Y_END) {
                    div.style.transform = 'translate(-50%, -50%) scale(1.3)'; // Scale up when in river
                    div.style.zIndex = '10';
                } else {
                    div.style.transform = 'translate(-50%, -50%) scale(1)';
                    div.style.zIndex = '1';
                }
            }

            // Update HP
            const hpBar = div.querySelector('.hp-bar') as HTMLDivElement;
            const hpPercent = Math.max(0, entity.hp / entity.stats.hp) * 100;
            hpBar.style.width = `${hpPercent}%`;
            hpBar.style.backgroundColor = entity.team === 'blue' ? '#0f0' : '#f00';
            
            if (entity.stats.type === 'tower') {
                const hpText = div.querySelector('.tower-hp-text') as HTMLDivElement;
                if (hpText) hpText.innerText = Math.ceil(entity.hp).toString();
            }
            
            // Update Ability visual feedback
            if (entity.currentAbilityEffect === 'cloaking_cape') {
                div.style.opacity = '0.4';
                div.style.boxShadow = '0 0 10px 5px #8a2be2'; // Purple stealth aura
            } else if (entity.currentAbilityEffect !== 'none') {
                div.style.opacity = '1.0';
                div.style.boxShadow = '0 0 10px 5px yellow';
            } else {
                div.style.opacity = '1.0';
                div.style.boxShadow = 'none';
            }

            // Render Pathing
            if (entity.pathPoints && entity.pathPoints.length > 0 && entity.isMoving) {
                let pathEl = pathEls.get(entity.id);
                if (!pathEl) {
                    pathEl = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                    pathEl.setAttribute('fill', 'none');
                    pathEl.setAttribute('stroke', entity.team === 'blue' ? 'rgba(52, 152, 219, 0.5)' : 'rgba(231, 76, 60, 0.5)');
                    pathEl.setAttribute('stroke-width', '4');
                    pathEl.setAttribute('stroke-dasharray', '5, 5');
                    pathSvg.appendChild(pathEl);
                    pathEls.set(entity.id, pathEl);
                }
                
                // Construct points string starting from entity pos
                const points = [entity.pos, ...entity.pathPoints]
                    .map(p => `${p.x * pxPerTileX},${p.y * pxPerTileY}`)
                    .join(' ');
                pathEl.setAttribute('points', points);
            } else {
                // Clear path if no longer moving
                const pathEl = pathEls.get(entity.id);
                if (pathEl) {
                    pathEl.remove();
                    pathEls.delete(entity.id);
                }
            }
        }

        requestAnimationFrame(render);
    }

    render();

    container.onclick = (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / pxPerTileX;
        const y = (e.clientY - rect.top) / pxPerTileY;
        const clickPos = new Vector2(x, y);

        if (selectedCard) {
            game.addEntityById(selectedCard.id, placementTeam, clickPos);
        }
    };
}

setupUI();
initRenderer();
game.start();

// Game loop
setInterval(() => {
    game.update(1 / CONFIG.TICKS_PER_SECOND);
}, 1000 / CONFIG.TICKS_PER_SECOND);
