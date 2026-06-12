import { Entity } from './Entity';
import type { EntityStats, Team } from './Entity';
import { Vector2 } from './Vector2';
import { CONFIG } from './config';
import { Cards } from './Cards';

export interface Projectile {
    id: number;
    pos: Vector2;
    target: Entity;
    damage: number;
    speed: number;
    team: 'blue' | 'red';
    onHit?: () => void;
}

export class Game {
    entities: Entity[] = [];
    projectiles: Projectile[] = [];
    nextEntityId: number = 1;
    nextProjectileId: number = 1;
    timeElapsed: number = 0;

    constructor() {}

    start() {
        // Blue Team (Bottom)
        this.addEntity(Cards.king_tower, 'blue', new Vector2(9, 29)); // Center back
        this.addEntity(Cards.princess_tower, 'blue', new Vector2(3, 25)); // Left
        this.addEntity(Cards.princess_tower, 'blue', new Vector2(15, 25)); // Right

        // Red Team (Top)
        this.addEntity(Cards.king_tower, 'red', new Vector2(9, 3)); // Center back
        this.addEntity(Cards.princess_tower, 'red', new Vector2(3, 7)); // Left
        this.addEntity(Cards.princess_tower, 'red', new Vector2(15, 7)); // Right
    }

    addEntity(stats: EntityStats, team: Team, pos: Vector2): Entity {
        // If it's a swarm card, spawn multiple
        if (stats.spawnCount && stats.spawnCount > 1) {
            let firstEntity: Entity | null = null;
            const radius = stats.spawnRadius || 1.0;
            const swarmGroupId = Math.random().toString(36).substring(7); // Shared group ID for the swarm
            for (let i = 0; i < stats.spawnCount; i++) {
                // Simple circular spread
                const angle = (i / stats.spawnCount) * Math.PI * 2;
                const offset = new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius);
                const e = new Entity(this.nextEntityId++, stats, team, pos.add(offset), this);
                e.cloneGroupId = swarmGroupId; // Override the constructor's random ID
                this.entities.push(e);
                if (!firstEntity) firstEntity = e;
            }
            return firstEntity!; // Returning one representative entity
        } else {
            const entity = new Entity(this.nextEntityId++, stats, team, pos, this);
            this.entities.push(entity);
            return entity;
        }
    }

    addEntityById(id: string, team: Team, pos: Vector2): Entity | null {
        const stats = Cards[id as keyof typeof Cards];
        if (!stats) return null;
        return this.addEntity(stats, team, pos);
    }

    update(dt: number) {
        this.timeElapsed += dt;

        // Update entities
        for (const entity of this.entities) {
            entity.update(dt);
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            
            // If target is dead, projectile still travels to last known pos, but to keep simple we'll just despawn or hit immediately if close.
            if (p.target.hp <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }

            const dir = p.target.pos.sub(p.pos);
            const dist = dir.mag();
            const moveDist = p.speed * dt;

            if (dist <= moveDist) {
                // Hit!
                p.target.takeDamage(p.damage);
                if (p.onHit) p.onHit();
                this.projectiles.splice(i, 1);
            } else {
                p.pos = p.pos.add(dir.normalize().mul(moveDist));
            }
        }

        // Remove dead entities
        this.entities = this.entities.filter(e => e.hp > 0);

        this.resolveCollisions();
        this.constrainEntities();
    }

    rivers = [
        { x: -5, y: CONFIG.RIVER_Y_START, width: CONFIG.LEFT_BRIDGE_X + 5, height: CONFIG.RIVER_Y_END - CONFIG.RIVER_Y_START },
        { x: CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH, y: CONFIG.RIVER_Y_START, width: CONFIG.RIGHT_BRIDGE_X - (CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH), height: CONFIG.RIVER_Y_END - CONFIG.RIVER_Y_START },
        { x: CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH, y: CONFIG.RIVER_Y_START, width: CONFIG.ARENA_WIDTH + 5 - (CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH), height: CONFIG.RIVER_Y_END - CONFIG.RIVER_Y_START }
    ];

    constrainEntities() {
        for (const entity of this.entities) {
            // Keep in bounds
            entity.pos.x = Math.max(entity.stats.radius, Math.min(CONFIG.ARENA_WIDTH - entity.stats.radius, entity.pos.x));
            entity.pos.y = Math.max(entity.stats.radius, Math.min(CONFIG.ARENA_HEIGHT - entity.stats.radius, entity.pos.y));

            // River collision via AABB
            const isDashing = entity.currentAbilityEffect === 'dashing_dash';
            if (!entity.stats.isAir && !entity.stats.jumpsRiver && !isDashing) {
                for (const river of this.rivers) {
                    const closestX = Math.max(river.x, Math.min(entity.pos.x, river.x + river.width));
                    const closestY = Math.max(river.y, Math.min(entity.pos.y, river.y + river.height));

                    const dx = entity.pos.x - closestX;
                    const dy = entity.pos.y - closestY;
                    const distSq = dx * dx + dy * dy;
                    
                    if (distSq < entity.stats.radius * entity.stats.radius) {
                        if (distSq === 0) {
                            // Center is exactly inside, push out to nearest edge
                            const distToLeft = entity.pos.x - river.x;
                            const distToRight = (river.x + river.width) - entity.pos.x;
                            const distToTop = entity.pos.y - river.y;
                            const distToBottom = (river.y + river.height) - entity.pos.y;
                            
                            const min = Math.min(distToLeft, distToRight, distToTop, distToBottom);
                            if (min === distToLeft) entity.pos.x = river.x - entity.stats.radius;
                            else if (min === distToRight) entity.pos.x = river.x + river.width + entity.stats.radius;
                            else if (min === distToTop) entity.pos.y = river.y - entity.stats.radius;
                            else entity.pos.y = river.y + river.height + entity.stats.radius;
                        } else {
                            const dist = Math.sqrt(distSq);
                            const overlap = entity.stats.radius - dist;
                            entity.pos.x += (dx / dist) * overlap;
                            entity.pos.y += (dy / dist) * overlap;
                        }
                    }
                }
            }
        }
    }

    addProjectile(pos: Vector2, target: Entity, damage: number, speed: number, team: 'blue' | 'red', onHit?: () => void) {
        this.projectiles.push({
            id: this.nextProjectileId++,
            pos: pos.clone(),
            target,
            damage,
            speed,
            team,
            onHit
        });
    }

    resolveCollisions() {
        // Advanced steering behaviors based on official CSV Mass and CollisionRadius
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const a = this.entities[i];
                const b = this.entities[j];

                // Skip if both are buildings/towers or both are air
                if (a.stats.speed === 0 && b.stats.speed === 0) continue;
                if (a.stats.isAir && b.stats.isAir) continue; // Air units can overlap
                if (a.stats.isAir !== b.stats.isAir) continue; // Air and ground don't collide

                const distSq = a.pos.distanceSquaredTo(b.pos);
                // Convert integer CSV collision radius to tiles (e.g. 750 -> 0.75, 500 -> 0.50)
                const radiusA = a.stats.radius; 
                const radiusB = b.stats.radius;
                const minDist = radiusA + radiusB;
                
                if (distSq < minDist * minDist && distSq > 0.0001) {
                    if (a.stats.mass === Infinity && b.stats.mass === Infinity) {
                        continue; // Both static, don't move
                    }
                    
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const dir = a.pos.sub(b.pos).normalize();

                    let ratioA = 0.5, ratioB = 0.5;
                    if (a.stats.mass === Infinity) {
                        ratioA = 0; ratioB = 1;
                    } else if (b.stats.mass === Infinity) {
                        ratioA = 1; ratioB = 0;
                    } else {
                        // Official Mass logic: Heavy units completely push aside light units.
                        // Mass scale: Giant = 18, Knight = 6, Skeleton = 1
                        const totalMass = a.stats.mass + b.stats.mass;
                        ratioA = b.stats.mass / totalMass;
                        ratioB = a.stats.mass / totalMass;
                        
                        // Amplify the mass difference to mimic the strict engine repulsion
                        if (a.stats.mass >= b.stats.mass * 3) {
                            ratioA = 0.05; ratioB = 0.95; // A dominates B
                        } else if (b.stats.mass >= a.stats.mass * 3) {
                            ratioA = 0.95; ratioB = 0.05; // B dominates A
                        }
                    }

                    if (ratioA > 0) a.pos = a.pos.add(dir.mul(overlap * ratioA));
                    if (ratioB > 0) b.pos = b.pos.sub(dir.mul(overlap * ratioB));
                    
                    // Sliding along buildings
                    if (a.stats.mass === Infinity || b.stats.mass === Infinity) {
                        const troop = a.stats.mass === Infinity ? b : a;
                        const building = a.stats.mass === Infinity ? a : b;
                        let pushDir = troop.pos.sub(building.pos).normalize();
                        if (Math.abs(pushDir.x) < 0.1) {
                            pushDir.x = pushDir.x >= 0 ? 0.3 : -0.3;
                            troop.pos = troop.pos.add(pushDir.normalize().mul(overlap));
                        }
                    }

                    // Flag for retargeting if physically displaced significantly
                    if (overlap * ratioA > 0.1) a.wasNudged = true;
                    if (overlap * ratioB > 0.1) b.wasNudged = true;
                }
            }
        }
    }
}
