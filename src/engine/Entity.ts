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
    
    // Projectiles
    projectileSpeed?: number; // E.g. 10 tiles/sec. If undefined, attacks are instant

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
    isMoving: boolean = false;
    cloneGroupId: string = ''; // For tracking evo skeleton limits
    wasNudged: boolean = false;
    pathPoints: Vector2[] = []; // For frontend debug visualization

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

        // 2. Move or Attack
        if (this.target) {
            const dist = this.pos.distanceTo(this.target.pos) - this.stats.radius - this.target.stats.radius;
            if (dist <= this.stats.range) {
                // In range, attack
                this.pathPoints = [];
                this.attackCooldown -= dt;
                
                // Archer Queen Cloaking Cape attack speed boost (+180%)
                if (this.currentAbilityEffect === 'cloaking_cape') {
                    this.attackCooldown -= dt * 1.8;
                }
                
                if (this.attackCooldown <= 0) {
                    this.attack(this.target);
                    this.attackCooldown = this.stats.hitSpeed;
                }
            } else {
                // Move towards target
                this.moveTowards(this.target.pos, dt);
                this.isMoving = true;
            }
        } else if (this.stats.speed > 0) {
            // No target, move towards enemy towers by default
            this.moveTowardsDefault(dt);
            this.isMoving = true;
        }
    }

    updateTarget() {
        if (this.target && this.target.hp <= 0) {
            this.target = null;
        }

        // Drop target if they become cloaked (Archer Queen ability)
        if (this.target && this.target.currentAbilityEffect === 'cloaking_cape') {
            this.target = null;
        }

        if (this.target) {
            const dist = this.pos.distanceTo(this.target.pos) - this.stats.radius - this.target.stats.radius;
            // Buildings drop target immediately if out of range
            if (this.stats.speed === 0) {
                if (dist > this.stats.range) {
                    this.target = null;
                }
            } else {
                if (dist > this.stats.sightRange + 2) { // Kited too far
                    this.target = null;
                }
            }
        }

        if (this.wasNudged) {
            this.target = null;
            this.wasNudged = false;
        }

        // Only search for a new target if we don't have one
        if (!this.target) {
            let bestTarget: Entity | null = null;
            let bestDist = this.stats.sightRange;

            for (const entity of this.game.entities) {
                if (entity.team === this.team || entity.hp <= 0) continue;
                if (entity.currentAbilityEffect === 'cloaking_cape') continue; // Untargetable
                if (this.stats.isBuildingTargeter && entity.stats.type === 'troop') continue;
                if (this.stats.targetType === 'ground' && entity.stats.isAir) continue;
                if (this.stats.targetType === 'air' && !entity.stats.isAir) continue;

                const dist = this.pos.distanceTo(entity.pos) - this.stats.radius - entity.stats.radius;
                
                if (dist <= bestDist) {
                    bestDist = dist;
                    bestTarget = entity;
                }
            }

            this.target = bestTarget;
        }
    }

    moveTowards(targetPos: Vector2, dt: number) {
        if (this.stats.speed <= 0) return;

        let finalTargetPos = targetPos;

        // Pathfinding: If ground unit and doesn't jump river, must cross bridges
        if (!this.stats.isAir && !this.stats.jumpsRiver) {
            const inRiverY = this.pos.y >= CONFIG.RIVER_Y_START && this.pos.y <= CONFIG.RIVER_Y_END;
            
            // Cross river if target is on the other side
            const crossRiver = (this.pos.y >= CONFIG.RIVER_Y_END && targetPos.y <= CONFIG.RIVER_Y_START) || 
                               (this.pos.y <= CONFIG.RIVER_Y_START && targetPos.y >= CONFIG.RIVER_Y_END);

            if (crossRiver && !inRiverY) {
                // Not in the river yet, but need to cross. Target the closest bridge entrance!
                const bridgeY = this.pos.y >= CONFIG.RIVER_Y_END ? CONFIG.RIVER_Y_END : CONFIG.RIVER_Y_START;
                
                const leftBridgeCenter = new Vector2(CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH / 2, bridgeY);
                const rightBridgeCenter = new Vector2(CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH / 2, bridgeY);
                
                const distViaLeft = this.pos.distanceTo(leftBridgeCenter) + leftBridgeCenter.distanceTo(targetPos);
                const distViaRight = this.pos.distanceTo(rightBridgeCenter) + rightBridgeCenter.distanceTo(targetPos);
                
                finalTargetPos = distViaLeft < distViaRight ? leftBridgeCenter : rightBridgeCenter;
                this.pathPoints = [finalTargetPos, targetPos];
            } else {
                this.pathPoints = [targetPos];
            }
        } else {
            this.pathPoints = [targetPos];
        }

        let dir = finalTargetPos.sub(this.pos).normalize();
        this.pos = this.pos.add(dir.mul(this.stats.speed * dt));
    }

    moveTowardsDefault(dt: number) {
        const isLeftLane = this.pos.x < CONFIG.ARENA_WIDTH / 2;
        const bridgeX = isLeftLane ? CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH / 2 : CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH / 2;
        
        const isBlue = this.team === 'blue';
        const hasCrossed = isBlue ? this.pos.y <= CONFIG.RIVER_Y_START : this.pos.y >= CONFIG.RIVER_Y_END;

        if (!hasCrossed) {
            // Target PAST the bridge entrance to ensure we fully cross it!
            const bridgeY = isBlue ? CONFIG.RIVER_Y_START - 1 : CONFIG.RIVER_Y_END + 1;
            this.moveTowards(new Vector2(bridgeX, bridgeY), dt);
        } else {
            // Once across the river, target the enemy tower
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
            if (bestTower) {
                this.moveTowards(bestTower.pos, dt);
            } else {
                const dir = this.team === 'blue' ? -1 : 1;
                this.pos.y += dir * this.stats.speed * dt;
                this.pathPoints = [new Vector2(this.pos.x, this.pos.y + dir * 10)];
            }
        }
    }

    attack(target: Entity) {
        if (this.stats.projectileSpeed) {
            // Ranged attack, spawn projectile
            this.game.addProjectile(
                this.pos.clone(),
                target,
                this.stats.damage,
                this.stats.projectileSpeed,
                this.team,
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
        }
    }
}
