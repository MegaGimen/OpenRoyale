import { Vector2 } from './Vector2';
import { Game } from './Game';
import { CONFIG } from './config';
import { Cards } from './Cards';

export type Team = 'blue' | 'red';
export type TargetType = 'ground' | 'air' | 'building' | 'all';
export type EntityType = 'troop' | 'building' | 'tower';

export interface AbilityStats {
    name: string;
    cooldown: number; // Cooldown after use
    elixirCost: number;
    // Ability effects (could be implemented as flags or specific effect IDs)
    effect: 'taunt_shield' | 'spawn_turret' | 'throw_enemies' | 'dash' | 'cloak' | 'summon_skeletons' | 'none';
    duration?: number;
    radius?: number;
}

export interface EntityStats {
    id: string;
    name: string;
    type: EntityType;
    hp: number;
    damage: number;
    hitSpeed: number; // in seconds
    loadTime: number; // in seconds (time from attack start to damage point)
    speed: number; // in tiles/sec (0 for buildings)
    range: number; // attack range in tiles
    sightRange: number; // aggro range
    radius: number; // collision radius
    mass: number;
    targetType: TargetType; // what it can attack
    isBuildingTargeter?: boolean;
    
    // Swarm/Placement Mechanics
    spawnCount?: number;
    spawnRadius?: number;
    // Movement
    isAir: boolean;
    jumpsRiver?: boolean; // For Hog Rider
    
    // Projectiles & AOE
    projectileSpeed?: number; // E.g. 10 tiles/sec. If undefined, attacks are instant
    projectileAsset?: string;
    projectileTrajectory?: 'line' | 'parabola';
    splashRadius?: number; // If set, deals AOE damage in this radius

    // Evolution Mechanics
    movingShieldDamageReduction?: number; // Percentage reduction (e.g. 0.6)
    spawnOnHitId?: string; // ID of stat to spawn on hit
    maxClones?: number; // for Evo skeletons limit

    // Active Ability (Champions & Elite Cards)
    ability?: AbilityStats;
    
    // Building
    lifetime?: number; // In seconds
}

export class Entity {
    id: number;
    stats: EntityStats;
    team: Team;
    pos: Vector2;
    hp: number;
    game: Game;
    
    // State
    target: Entity | null = null;
    attackCooldown: number = 0;
    actionFrameTimer: number = -1; // -1 means not in attack animation
    isAttacking: boolean = false;
    isMoving: boolean = false;
    facingDirection: Vector2 = new Vector2(0, 1);
    cloneGroupId: string = ''; // For tracking evo skeleton limits
    wasNudged: boolean = false;
    pathPoints: Vector2[] = []; // For frontend debug visualization

    // Tower State
    activationState: 'asleep' | 'activating' | 'awake' = 'awake';
    activationTimer: number = 0;

    // Ability State
    abilityCooldown: number = 0;
    activeAbilityTimer: number = 0;
    currentAbilityEffect: string = 'none';
    dashState?: { target: Entity | null; hitIds: Set<number>; hitsLeft: number; forwardDashDist: number };
    
    constructor(id: number, stats: EntityStats, team: Team, pos: Vector2, game: Game) {
        this.id = id;
        this.stats = stats;
        this.team = team;
        this.pos = pos;
        this.hp = stats.hp;
        this.game = game;
        
        if (stats.name === 'King Tower') {
            this.activationState = 'asleep';
        }
        
        // Assign a random group ID for cloned swarms like Evo Skeletons
        this.cloneGroupId = Math.random().toString(36).substring(7);
    }

    useAbility() {
        if (!this.stats.ability || this.hp <= 0) return false;
        if (this.abilityCooldown > 0) return false;

        // Activate ability
        this.abilityCooldown = this.stats.ability.cooldown;
        this.activeAbilityTimer = this.stats.ability.duration || 0;
        this.currentAbilityEffect = this.stats.ability.effect;

        // Instant effects
        if (this.currentAbilityEffect === 'spawn_turret') {
            const spawnDir = this.team === 'blue' ? new Vector2(0, -1) : new Vector2(0, 1);
            this.game.addEntityById('elite_turret', this.team, this.pos.add(spawnDir.mul(3.0)));
        } else if (this.currentAbilityEffect === 'throw_enemies') {
            // Throw nearby enemies
            const radius = this.stats.ability.radius || 3.0;
            for (const e of this.game.entities) {
                if (e.team !== this.team && e.pos.distanceTo(this.pos) <= radius && e.stats.type === 'troop') {
                    // "Throw" to other lane (simple teleport for simulation)
                    e.pos.x = CONFIG.ARENA_WIDTH - e.pos.x;
                    e.takeDamage(200); // Throw damage
                }
            }
        } else if (this.currentAbilityEffect === 'dashing_dash') {
            this.dashState = {
                target: null,
                hitIds: new Set<number>(),
                hitsLeft: 10,
                forwardDashDist: 3.5
            };
        }

        return true;
    }

    update(dt: number) {
        if (this.hp <= 0) return;

        // Lifetime decay for buildings
        if (this.stats.lifetime) {
            const decayRate = this.stats.hp / this.stats.lifetime;
            this.hp -= decayRate * dt;
            if (this.hp <= 0) {
                this.hp = 0;
                return;
            }
        }

        // Tower activation logic
        if (this.activationState === 'activating') {
            this.activationTimer -= dt;
            if (this.activationTimer <= 0) {
                this.activationState = 'awake';
            }
        }

        this.isMoving = false;

        // Update ability timers
        if (this.abilityCooldown > 0) this.abilityCooldown -= dt;
        if (this.activeAbilityTimer > 0) {
            this.activeAbilityTimer -= dt;
            if (this.activeAbilityTimer <= 0) {
                this.currentAbilityEffect = 'none';
            }
        }

        // Taunt logic
        if (this.currentAbilityEffect === 'taunt_shield') {
            const radius = this.stats.ability?.radius || 4.0;
            for (const e of this.game.entities) {
                if (e.team !== this.team && e.pos.distanceTo(this.pos) <= radius) {
                    e.target = this; // Force target to this entity
                }
            }
        }

        // Dashing Dash logic
        if (this.currentAbilityEffect === 'dashing_dash' && this.dashState) {
            const state = this.dashState;
            
            // Find next target if we don't have one
            if (!state.target || state.target.hp <= 0) {
                let bestTarget = null;
                let bestDist = this.stats.ability?.radius || 5.5;
                for (const e of this.game.entities) {
                    if (e.team !== this.team && !e.stats.isAir && e.hp > 0 && !state.hitIds.has(e.id)) {
                        const dist = this.pos.distanceTo(e.pos);
                        if (dist <= bestDist) {
                            bestDist = dist;
                            bestTarget = e;
                        }
                    }
                }
                
                if (bestTarget) {
                    state.target = bestTarget;
                    state.hitIds.add(bestTarget.id);
                } else {
                    // No targets left
                    if (state.hitIds.size > 0 || state.forwardDashDist <= 0) {
                        this.currentAbilityEffect = 'none';
                        return; // End dash
                    }
                }
            }

            // Move very fast towards target or forward
            const dashSpeed = 25.0; // Very fast visual dash
            const moveDist = dashSpeed * dt;
            
            if (state.target) {
                const dir = state.target.pos.sub(this.pos);
                const dist = dir.mag();
                
                if (dist <= moveDist + this.stats.radius + state.target.stats.radius) {
                    // Hit!
                    state.target.takeDamage(this.stats.damage * 2.08);
                    this.pos = state.target.pos.clone(); // Snap to target
                    state.hitsLeft--;
                    state.target = null; // Find next target next frame
                    
                    if (state.hitsLeft <= 0) {
                        this.currentAbilityEffect = 'none';
                    }
                } else {
                    this.pos = this.pos.add(dir.normalize().mul(moveDist));
                }
            } else if (state.forwardDashDist > 0) {
                // Dash straight forward
                const dirY = this.team === 'blue' ? -1 : 1;
                const distToMove = Math.min(moveDist, state.forwardDashDist);
                this.pos.y += dirY * distToMove;
                state.forwardDashDist -= distToMove;
                if (state.forwardDashDist <= 0) {
                    this.currentAbilityEffect = 'none';
                }
            }
            
            this.isMoving = true;
            return; // Skip normal update/attack while dashing!
        }

        // 1. Find or update target
        this.updateTarget();

        // Decrement attack cooldown if we are not currently in the load phase of an attack
        if (!this.isAttacking && this.attackCooldown > 0) {
            let dtScaled = dt;
            if (this.currentAbilityEffect === 'cloaking_cape') dtScaled = dt * 1.8;
            this.attackCooldown -= dtScaled;
        }

        // 2. Move or Attack
        if (this.target) {
            const dist = this.pos.distanceTo(this.target.pos) - this.stats.radius - this.target.stats.radius;
            if (dist <= this.stats.range) {
                // In range, attack
                this.pathPoints = [];
                
                // Always face the target while in attack range
                if (this.target.pos.x !== this.pos.x || this.target.pos.y !== this.pos.y) {
                    this.facingDirection = this.target.pos.sub(this.pos).normalize();
                }

                if (this.attackCooldown <= 0 && !this.isAttacking) {
                    // Start attack animation phase (LoadTime)
                    this.isAttacking = true;
                    this.actionFrameTimer = this.stats.loadTime || (this.stats.hitSpeed * 0.5); // Fallback if no loadTime
                }

                if (this.isAttacking) {
                    let dtScaled = dt;
                    if (this.currentAbilityEffect === 'cloaking_cape') dtScaled = dt * 1.8;
                    this.actionFrameTimer -= dtScaled;

                    if (this.actionFrameTimer <= 0) {
                        // Action frame reached! Apply damage
                        this.attack(this.target);
                        this.isAttacking = false;
                        // Set cooldown for the remainder of the HitSpeed
                        this.attackCooldown = this.stats.hitSpeed - (this.stats.loadTime || 0);
                        if (this.attackCooldown < 0) this.attackCooldown = 0.1;
                    }
                }
            } else {
                // Move towards target and cancel any pending attack
                this.isAttacking = false;
                this.actionFrameTimer = -1;
                this.moveTowards(this.target.pos, dt);
                this.isMoving = true;
            }
        } else if (this.stats.speed > 0) {
            // No target, move towards enemy towers by default
            this.isAttacking = false;
            this.actionFrameTimer = -1;
            this.moveTowardsDefault(dt);
            this.isMoving = true;
        }
    }

    updateTarget() {
        if (this.activationState !== 'awake') {
            this.target = null;
            return;
        }
        
        if (this.target && this.target.hp <= 0) {
            this.target = null;
        }

        // Drop target if they become cloaked (Archer Queen ability)
        if (this.target && this.target.currentAbilityEffect === 'cloaking_cape') {
            this.target = null;
        }

        let isInAttackRange = false;
        if (this.target) {
            const dist = this.pos.distanceTo(this.target.pos) - this.stats.radius - this.target.stats.radius;
            // Buildings drop target immediately if out of range
            if (this.stats.speed === 0) {
                if (dist > this.stats.range) {
                    this.target = null;
                } else {
                    isInAttackRange = true;
                }
            } else {
                if (dist > this.stats.sightRange + 2) { // Kited too far
                    this.target = null;
                } else if (dist <= this.stats.range) {
                    isInAttackRange = true;
                }
            }
        }

        if (this.wasNudged) {
            this.target = null;
            this.wasNudged = false;
            isInAttackRange = false;
        }

        // Search for a new target if we don't have one, OR if we are currently pursuing (not in attack range)
        if (!this.target || !isInAttackRange) {
            let bestTarget: Entity | null = this.target;
            let bestDist = this.target ? 
                (this.pos.distanceTo(this.target.pos) - this.stats.radius - this.target.stats.radius) : 
                this.stats.sightRange;

            for (const entity of this.game.entities) {
                if (entity.team === this.team || entity.hp <= 0) continue;
                if (entity === this.target) continue; // Already our target
                if (entity.currentAbilityEffect === 'cloaking_cape') continue; // Untargetable
                if (this.stats.isBuildingTargeter && entity.stats.type === 'troop') continue;
                if (this.stats.targetType === 'ground' && entity.stats.isAir) continue;
                if (this.stats.targetType === 'air' && !entity.stats.isAir) continue;

                const dist = this.pos.distanceTo(entity.pos) - this.stats.radius - entity.stats.radius;
                
                // If pursuing, require the new target to be strictly closer by a small margin to prevent flickering
                if (dist <= bestDist - (this.target ? 0.2 : 0)) {
                    bestDist = dist;
                    bestTarget = entity;
                }
            }

            if (bestTarget !== this.target) {
                this.target = bestTarget;
            }
        }
    }

    isLineClear(a: Vector2, b: Vector2): boolean {
        if (a.y <= CONFIG.RIVER_Y_START && b.y <= CONFIG.RIVER_Y_START) return true;
        if (a.y >= CONFIG.RIVER_Y_END && b.y >= CONFIG.RIVER_Y_END) return true;

        const y0 = Math.max(CONFIG.RIVER_Y_START, Math.min(a.y, b.y));
        const y1 = Math.min(CONFIG.RIVER_Y_END, Math.max(a.y, b.y));

        if (y0 === y1) {
            if (y0 === CONFIG.RIVER_Y_START || y0 === CONFIG.RIVER_Y_END) return true;
            const minX = Math.min(a.x, b.x);
            const maxX = Math.max(a.x, b.x);
            const safeMargin = this.stats.radius + 0.05;
            const inLeftBridge = minX >= CONFIG.LEFT_BRIDGE_X + safeMargin && maxX <= CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH - safeMargin;
            const inRightBridge = minX >= CONFIG.RIGHT_BRIDGE_X + safeMargin && maxX <= CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH - safeMargin;
            return inLeftBridge || inRightBridge;
        }
        if (y0 > y1) return true;

        const getX = (y: number) => a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y);
        const x0 = getX(y0);
        const x1 = getX(y1);

        const minX = Math.min(x0, x1);
        const maxX = Math.max(x0, x1);

        // Account for unit's physical radius so they don't scrape the corner and get stuck
        const safeMargin = this.stats.radius + 0.05;
        const inLeftBridge = minX >= CONFIG.LEFT_BRIDGE_X + safeMargin && maxX <= CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH - safeMargin;
        const inRightBridge = minX >= CONFIG.RIGHT_BRIDGE_X + safeMargin && maxX <= CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH - safeMargin;

        return inLeftBridge || inRightBridge;
    }

    findPath(start: Vector2, target: Vector2): Vector2[] {
        if (this.isLineClear(start, target)) return [target];

        const waypoints = [
            new Vector2(CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH / 2, CONFIG.RIVER_Y_START),
            new Vector2(CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH / 2, CONFIG.RIVER_Y_END),
            new Vector2(CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH / 2, CONFIG.RIVER_Y_START),
            new Vector2(CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH / 2, CONFIG.RIVER_Y_END),
        ];

        const nodes = [start, target, ...waypoints];
        const numNodes = nodes.length;
        
        const adj: number[][] = Array(numNodes).fill(0).map(() => Array(numNodes).fill(Infinity));
        for (let i = 0; i < numNodes; i++) {
            for (let j = 0; j < numNodes; j++) {
                if (i === j) {
                    adj[i][j] = 0;
                } else if (this.isLineClear(nodes[i], nodes[j])) {
                    adj[i][j] = nodes[i].distanceTo(nodes[j]);
                }
            }
        }

        const dist = Array(numNodes).fill(Infinity);
        const prev = Array(numNodes).fill(-1);
        const unvisited = new Set([0, 1, 2, 3, 4, 5]);
        dist[0] = 0;

        while (unvisited.size > 0) {
            let u = -1;
            let minDist = Infinity;
            for (const v of unvisited) {
                if (dist[v] < minDist) {
                    minDist = dist[v];
                    u = v;
                }
            }

            if (u === -1 || u === 1) break;
            unvisited.delete(u);

            for (const v of unvisited) {
                const alt = dist[u] + adj[u][v];
                if (alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                }
            }
        }

        if (prev[1] === -1) return [target]; // Fallback if stuck

        const path: Vector2[] = [];
        let curr = 1;
        while (curr !== 0) {
            path.unshift(nodes[curr]);
            curr = prev[curr];
        }

        return path;
    }

    moveTowards(targetPos: Vector2, dt: number) {
        if (this.stats.speed <= 0) return;
        
        if (!this.stats.isAir && !this.stats.jumpsRiver) {
            this.pathPoints = this.findPath(this.pos, targetPos);
        } else {
            this.pathPoints = [targetPos];
        }

        if (this.pathPoints.length > 0) {
            let targetWaypoint = this.pathPoints[0];
            
            // Look-ahead: if we are extremely close to the immediate waypoint, 
            // face the next waypoint to prevent spinning/jitter at corners
            if (this.pathPoints.length > 1 && this.pos.distanceSquaredTo(targetWaypoint) < 1.0) {
                targetWaypoint = this.pathPoints[1];
            }
            
            let dir = targetWaypoint.sub(this.pos).normalize();
            if (dir.x !== 0 || dir.y !== 0) {
                // Smooth facing direction or just set it
                this.facingDirection = dir;
            }
            
            // But we actually physically move towards the original immediate waypoint 
            // so we don't cut corners too sharply and clip into rivers
            let moveDir = this.pathPoints[0].sub(this.pos).normalize();
            this.pos = this.pos.add(moveDir.mul(this.stats.speed * dt));
        }
    }

    moveTowardsDefault(dt: number) {
        let bestTower = null;
        let bestDist = Infinity;
        for (const e of this.game.entities) {
            if (e.team !== this.team && (e.stats.type === 'tower' || e.stats.type === 'building')) {
                const dist = this.pos.distanceSquaredTo(e.pos);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestTower = e;
                }
            }
        }
        
        const targetPos = bestTower ? bestTower.pos : new Vector2(this.pos.x, this.pos.y + (this.team === 'blue' ? -10 : 10));
        this.moveTowards(targetPos, dt);
    }

    attack(target: Entity) {
        if (this.stats.projectileSpeed) {
            let spawnPos = this.pos.clone();
            if (this.stats.id === 'king_tower') {
                const dir = target.pos.sub(this.pos).normalize();
                spawnPos = spawnPos.add(dir.mul(1.2)); // Offset from center to cannon tip, pushed out further
            }
            // Ranged attack, spawn projectile
            this.game.addProjectile(
                this.stats.id,
                spawnPos,
                target,
                this.stats.damage,
                this.stats.projectileSpeed,
                this.team,
                this.stats.splashRadius,
                this.stats.projectileAsset,
                this.stats.projectileTrajectory,
                () => this.onDealDamage(target)
            );
        } else {
            // Melee attack, instant damage
            target.takeDamage(this.stats.damage);
            this.onDealDamage(target);
        }
    }

    onDealDamage(target: Entity) {
        // Feedback mechanisms
        if (this.stats.id === 'battle_healer') {
            // Heal friendly units in a 4.0 radius
            for (const e of this.game.entities) {
                if (e.team === this.team && e.hp > 0 && e.stats.type === 'troop') {
                    if (e.pos.distanceSquaredTo(this.pos) <= 16.0) { // 4^2
                        e.hp = Math.min(e.hp + 84, e.stats.hp); // Heal 84 HP
                    }
                }
            }
        }

        // Evolution feedback mechanism
        if (this.stats.spawnOnHitId) {
            const cloneCount = this.game.entities.filter(e => e.cloneGroupId === this.cloneGroupId && e.hp > 0).length;
            if (!this.stats.maxClones || cloneCount < this.stats.maxClones) {
                const cloneStats = Cards[this.stats.spawnOnHitId as keyof typeof Cards];
                if (cloneStats) {
                    const spawnOffset = new Vector2((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
                    const clone = this.game.addEntity(cloneStats, this.team, this.pos.add(spawnOffset));
                    clone.cloneGroupId = this.cloneGroupId; // Add to same group
                    clone.attackCooldown = clone.stats.hitSpeed; // Wait before first attack
                }
            }
        }
    }

    takeDamage(amount: number) {
        let finalDamage = amount;
        
        // Evo Knight moving shield
        if (this.isMoving && this.stats.movingShieldDamageReduction) {
            finalDamage *= (1 - this.stats.movingShieldDamageReduction);
        }

        // Elite Knight Taunt Shield
        if (this.currentAbilityEffect === 'taunt_shield') {
            finalDamage *= 0.2; // 80% damage reduction
        }

        this.hp -= finalDamage;
        if (this.hp <= 0) {
            this.hp = 0;
            
            // If this is a Princess Tower, wake up the King Tower
            if (this.stats.name === 'Princess Tower') {
                for (const e of this.game.entities) {
                    if (e.team === this.team && e.stats.name === 'King Tower' && e.activationState === 'asleep') {
                        e.activationState = 'activating';
                        e.activationTimer = 97 / 30.0; // 97 frames at 30fps
                    }
                }
            }
        } else if (this.stats.name === 'King Tower' && this.activationState === 'asleep') {
            this.activationState = 'activating';
            this.activationTimer = 97 / 30.0;
        }
    }
}
