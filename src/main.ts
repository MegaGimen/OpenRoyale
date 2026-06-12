import './style.css';
import { Game } from './engine/Game';
import { Vector2 } from './engine/Vector2';
import { CONFIG } from './engine/config';
import type { EntityStats } from './engine/Entity';
import { Cards } from './engine/Cards';
import { SCRenderer } from './engine/SCRenderer';

const game = new Game();

const baseCards = [Cards.knight, Cards.archers, Cards.giant, Cards.pekka, Cards.musketeer, Cards.hog_rider, Cards.skeletons, Cards.elite_barbarians, Cards.battle_healer];
const evoCards = [Cards.evo_knight, Cards.evo_skeletons];
const championCards = [Cards.golden_knight, Cards.archer_queen];
const eliteCards = [Cards.elite_knight, Cards.elite_musketeer, Cards.elite_giant];

(window as any).game = game;
(window as any).Vector2 = Vector2;



async function loadMappings() {
    const loadingUI = document.createElement('div');
    loadingUI.id = 'loading-ui';
    loadingUI.style.position = 'absolute';
    loadingUI.style.top = '0';
    loadingUI.style.left = '0';
    loadingUI.style.width = '100%';
    loadingUI.style.height = '100%';
    loadingUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    loadingUI.style.color = '#fff';
    loadingUI.style.display = 'flex';
    loadingUI.style.flexDirection = 'column';
    loadingUI.style.alignItems = 'center';
    loadingUI.style.justifyContent = 'center';
    loadingUI.style.fontSize = '24px';
    loadingUI.style.zIndex = '9999';
    loadingUI.style.fontFamily = 'monospace';
    
    const textDiv = document.createElement('div');
    textDiv.innerText = 'Preloading Assets...';
    
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '300px';
    progressContainer.style.height = '20px';
    progressContainer.style.border = '2px solid white';
    progressContainer.style.marginTop = '10px';
    
    const progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = 'white';
    progressBar.style.transition = 'width 0.2s';
    
    progressContainer.appendChild(progressBar);
    loadingUI.appendChild(textDiv);
    loadingUI.appendChild(progressContainer);
    document.body.appendChild(loadingUI);

    const chars = ['chr_knight', 'chr_archer', 'chr_giant', 'chr_pekka', 'chr_minion', 'chr_skeleton', 'chr_barbarian', 'chr_musketeer', 'chr_hog_rider', 'chr_wizard', 'chr_princess', 'building_tower', 'effects'];
    let loaded = 0;
    
    const isCached = localStorage.getItem('sc_assets_cached') === 'true';
    if (isCached) {
        loadingUI.style.display = 'none';
        Promise.all(chars.map(c => SCRenderer.loadCharacter(c)));
        return;
    }

    for (const c of chars) {
        await SCRenderer.loadCharacter(c);
        loaded++;
        const p = Math.floor((loaded / chars.length) * 100);
        textDiv.innerText = `Preloading Asset Data: ${loaded} / ${chars.length}`;
        progressBar.style.width = `${p}%`;
    }
    
    localStorage.setItem('sc_assets_cached', 'true');
    loadingUI.style.display = 'none';
}
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
    river.style.zIndex = '1';
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
        bridge.style.zIndex = '2';
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

    const entityDivs = new Map<number, HTMLDivElement & { imgElements?: HTMLImageElement[] }>();
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
                SCRenderer.removeEntity(id);
                
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
                SCRenderer.removeProjectile(id);
            }
        }

        for (const p of game.projectiles) {
            let div = projectileDivs.get(p.id);
            if (!div) {
                div = document.createElement('div');
                div.className = 'projectile';
                div.style.position = 'absolute';
                div.style.width = '40px';
                div.style.height = '40px';
                div.style.zIndex = '10';
                div.style.transition = 'none'; // Fast update
                container.appendChild(div);
                projectileDivs.set(p.id, div);
            }

            // Calculate rotation based on direction to target
            let angle = 0;
            if (p.target && p.target.pos) {
                const dir = p.target.pos.sub(p.pos);
                angle = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
            }
            
            const arrowKey = p.team === 'red' ? 'projectile_arrow_basic_enemy' : 'projectile_arrow_basic';
            SCRenderer.updateProjectile(p.id, arrowKey, angle, p.pos.x * pxPerTileX, p.pos.y * pxPerTileY, 0.4);
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
                (div as any).imgElements = [];
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
                div.style.borderRadius = '50%'; // default for dots
                div.style.backgroundSize = 'contain';
                div.style.backgroundRepeat = 'no-repeat';
                div.style.backgroundPosition = 'center';
                
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

            // Render Sprite
            const charNameMap: Record<string, string> = {
                "Knight": "knight", 
                "Archers": "archer", 
                "Giant": "giant",
                "P.E.K.K.A": "pekka",
                "Minions": "minion",
                "Skeletons": "skeleton",
                "Barbarians": "barbarians",
                "Elite Barbarians": "barbarians",
                "Musketeer": "musketeer",
                "Hog Rider": "hog_rider",
                "Battle Healer": "battle_healer",
                "Princess": "princess",
                "Wizard": "wizard"
            };
            
            let charFolder = charNameMap[entity.stats.name];
            let isTower = false;
            let staticAnimKey = '';
            
            if (entity.stats.name === 'Princess Tower') {
                charFolder = 'building_tower';
                isTower = true;
                staticAnimKey = entity.team === 'red' ? 'StarTower_base_red' : 'StarTower_base_blue';
            } else if (entity.stats.name === 'King Tower') {
                charFolder = 'building_tower';
                isTower = true;
                staticAnimKey = entity.team === 'red' ? 'KingTower_red' : 'KingTower_blue';
            }


            let flipX = false;
            let scaleMultiplier = 1.0;

            if (charFolder) {
                let action = 'idle';
                if (entity.attackCooldown > 0 || entity.isAttacking) action = 'attack';
                else if (entity.isMoving) action = 'run';
                
                const dir = entity.facingDirection || new Vector2(0, 1);
                let angle_dy = dir.y;
                let angle = Math.atan2(angle_dy, dir.x) * 180 / Math.PI;
                if (angle < 0) angle += 360;
                
                let dirSuffix = '5';
                if (angle >= 67.5 && angle < 112.5) dirSuffix = '8'; // Down (90)
                else if (angle >= 112.5 && angle < 157.5) dirSuffix = '9'; // DownLeft (135)
                else if (angle >= 157.5 && angle < 202.5) dirSuffix = '4'; // Left (180)
                else if (angle >= 202.5 && angle < 247.5) dirSuffix = '1'; // UpLeft (225)
                else if (angle >= 247.5 && angle < 292.5) dirSuffix = '2'; // Up (270)
                else if (angle >= 292.5 && angle < 337.5) dirSuffix = '3'; // UpRight (315)
                else if (angle >= 337.5 || angle < 22.5) dirSuffix = '6'; // Right (0)
                else if (angle >= 22.5 && angle < 67.5) dirSuffix = '7'; // DownRight (45)

                const charPrefixStr = charFolder.startsWith('building_') ? charFolder : `chr_${charFolder}`;
                const t = performance.now() / 1000;
                const frameIndex = Math.floor(t * 30);
                
                let animProgress = -1;
                if (action === 'attack') {
                    const loadTime = entity.stats.loadTime || (entity.stats.hitSpeed * 0.5);
                    if (entity.isAttacking) {
                        animProgress = (loadTime - entity.actionFrameTimer) / entity.stats.hitSpeed;
                    } else {
                        const cooldownTotal = entity.stats.hitSpeed - loadTime;
                        animProgress = (loadTime + (cooldownTotal - entity.attackCooldown)) / entity.stats.hitSpeed;
                    }
                    animProgress = Math.max(0, Math.min(1, animProgress));
                }
                
                const isRed = entity.team === 'red';
                const actionToPass = isTower ? staticAnimKey : action;
                
                div.style.backgroundColor = 'transparent';
                div.style.borderRadius = '0';
                div.style.border = 'none';

                let finalFrameIndex = frameIndex;
                let aimAngle = -1;
                let overrideFlipX: boolean | null = null;
                
                if (entity.stats.name === 'King Tower') {
                    if (entity.activationState === 'asleep') {
                        finalFrameIndex = 0;
                        animProgress = -1;
                    } else if (entity.activationState === 'activating') {
                        animProgress = Math.max(0, 1 - (entity.activationTimer / (97/30.0)));
                        finalFrameIndex = 97; // Actually it doesn't matter since animProgress overrides it
                    } else if (entity.activationState === 'awake') {
                        finalFrameIndex = 97; // idle frame for active king
                        animProgress = -1; // STOP root animation from looping attack progress!
                        
                        let angleDeg = Math.atan2(entity.facingDirection.y, entity.facingDirection.x) * 180 / Math.PI;
                        if (angleDeg < 0) angleDeg += 360;
                        
                        // Map to SC Angle (0 is Up, 180 is Down)
                        let scAngle = (angleDeg + 90) % 360;
                        
                        if (scAngle <= 180) {
                            overrideFlipX = false;
                            aimAngle = Math.min(35, Math.round(scAngle / 5));
                        } else {
                            overrideFlipX = true;
                            aimAngle = Math.min(35, Math.round((360 - scAngle) / 5));
                        }
                    }
                } else if (entity.stats.name === 'Princess Tower') {
                    finalFrameIndex = frameIndex; // let SCRenderer handle princess logic
                }

                SCRenderer.updateEntity(
                    entity.id, 
                    charPrefixStr, 
                    actionToPass, 
                    dirSuffix, 
                    entity.team === 'red', 
                    finalFrameIndex, 
                    entity.pos.x * pxPerTileX, 
                    entity.pos.y * pxPerTileY, 
                    0.55,
                    action,
                    aimAngle,
                    overrideFlipX,
                    animProgress
                );
                
                scaleMultiplier = 0.55;
            } else {
                div.style.backgroundImage = '';
                div.style.backgroundColor = entity.team === 'blue' ? '#3498db' : '#e74c3c';
                div.style.borderRadius = '50%';
                div.style.width = `${entity.stats.radius * 2 * pxPerTileX}px`;
                div.style.height = `${entity.stats.radius * 2 * pxPerTileY}px`;
            }

            // Transform matrix
            const scaleX = flipX ? -scaleMultiplier : scaleMultiplier;
            div.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleMultiplier})`;

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

    SCRenderer.init(container).then(() => {
        render();
    });

    container.onclick = (e) => {
        const rect = container.getBoundingClientRect();
        const currentPxPerTileX = rect.width / CONFIG.ARENA_WIDTH;
        const currentPxPerTileY = rect.height / CONFIG.ARENA_HEIGHT;
        const x = (e.clientX - rect.left) / currentPxPerTileX;
        const y = (e.clientY - rect.top) / currentPxPerTileY;
        const clickPos = new Vector2(x, y);

        if (selectedCard) {
            game.addEntityById(selectedCard.id, placementTeam, clickPos);
        }
    };
}

async function boot() {
    await loadMappings();
    setupUI();
    initRenderer();
    game.start();

    // Game loop
    setInterval(() => {
        game.update(1 / CONFIG.TICKS_PER_SECOND);
    }, 1000 / CONFIG.TICKS_PER_SECOND);
}

boot();
