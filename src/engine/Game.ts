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

    constrainEntities() {
        for (const entity of this.entities) {
            if (entity.stats.type === 'building' || entity.stats.type === 'tower') continue;

            // Keep in bounds
            entity.pos.x = Math.max(entity.stats.radius, Math.min(CONFIG.ARENA_WIDTH - entity.stats.radius, entity.pos.x));
            entity.pos.y = Math.max(entity.stats.radius, Math.min(CONFIG.ARENA_HEIGHT - entity.stats.radius, entity.pos.y));

            // River collision
            const isDashing = entity.currentAbilityEffect === 'dashing_dash';
            if (!entity.stats.isAir && !entity.stats.jumpsRiver && !isDashing) {
                if (entity.pos.y > CONFIG.RIVER_Y_START + entity.stats.radius && entity.pos.y < CONFIG.RIVER_Y_END - entity.stats.radius) {
                    // Push out of river
                    const leftBridgeDist = Math.abs(entity.pos.x - (CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH/2));
                    const rightBridgeDist = Math.abs(entity.pos.x - (CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH/2));
                    
                    if (leftBridgeDist > CONFIG.BRIDGE_WIDTH/2 && rightBridgeDist > CONFIG.BRIDGE_WIDTH/2) {
                        // Push out of river
                        const slideTolerance = 1.5;
                        if (leftBridgeDist < CONFIG.BRIDGE_WIDTH/2 + slideTolerance) {
                            // Slide horizontally onto the left bridge
                            entity.pos.x = entity.pos.x < (CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH/2) ? 
                                CONFIG.LEFT_BRIDGE_X : CONFIG.LEFT_BRIDGE_X + CONFIG.BRIDGE_WIDTH;
                        } else if (rightBridgeDist < CONFIG.BRIDGE_WIDTH/2 + slideTolerance) {
                            // Slide horizontally onto the right bridge
                            entity.pos.x = entity.pos.x < (CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH/2) ? 
                                CONFIG.RIGHT_BRIDGE_X : CONFIG.RIGHT_BRIDGE_X + CONFIG.BRIDGE_WIDTH;
                        } else {
                            // Push vertically to nearest bank
                            const distToTop = Math.abs(entity.pos.y - CONFIG.RIVER_Y_START);
                            const distToBottom = Math.abs(entity.pos.y - CONFIG.RIVER_Y_END);
                            if (distToTop < distToBottom) {
                                entity.pos.y = CONFIG.RIVER_Y_START;
                            } else {
                                entity.pos.y = CONFIG.RIVER_Y_END;
                            }
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
        // Simple O(N^2) collision resolution
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const a = this.entities[i];
                const b = this.entities[j];

                // Skip if both are buildings/towers or both are air
                if (a.stats.speed === 0 && b.stats.speed === 0) continue;
                if (a.stats.isAir && b.stats.isAir) continue; // Air units can overlap in CR? Slightly push each other maybe, but let's ignore for now.
                if (a.stats.isAir !== b.stats.isAir) continue; // Air and ground don't collide

                const distSq = a.pos.distanceSquaredTo(b.pos);
                const minDist = a.stats.radius + b.stats.radius;
                
                if (distSq < minDist * minDist && distSq > 0.0001) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const dir = a.pos.sub(b.pos).normalize();

                    if (a.stats.speed === 0 || b.stats.speed === 0) {
                        // One is a building/tower, it shouldn't move. Push the troop 100%
                        const troop = a.stats.speed > 0 ? a : b;
                        const building = a.stats.speed === 0 ? a : b;
                        let pushDir = troop.pos.sub(building.pos).normalize();
                        
                        // Add consistent slide to perfectly aligned units so they smoothly circle the hitbox
                        if (Math.abs(pushDir.x) < 0.1) {
                            pushDir.x = pushDir.x >= 0 ? 0.3 : -0.3;
                            pushDir = pushDir.normalize();
                        }
                        
                        troop.pos = troop.pos.add(pushDir.mul(overlap));
                    } else {
                        // Both are troops, push based on mass
                        const totalMass = a.stats.mass + b.stats.mass;
                        const ratioA = b.stats.mass / totalMass;
                        const ratioB = a.stats.mass / totalMass;

                        a.pos = a.pos.add(dir.mul(overlap * ratioA));
                        b.pos = b.pos.sub(dir.mul(overlap * ratioB));
                        
                        // Flag for retargeting if physically displaced significantly
                        if (overlap * ratioA > 0.05) a.wasNudged = true;
                        if (overlap * ratioB > 0.05) b.wasNudged = true;
                    }
                }
            }
        }
    }
}
