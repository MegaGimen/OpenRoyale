import type { EntityStats } from './Entity';

export const Cards: Record<string, EntityStats> = {
    knight: {
        id: 'knight',
        name: 'Knight',
        type: 'troop',
        hp: 1666,
        damage: 202,
        hitSpeed: 1.2,
        loadTime: 0.7,
        speed: 1.0, // Medium
        range: 0.8, // Melee
        sightRange: 5.5,
        radius: 0.5,
        mass: 6,
        isAir: false,
        targetType: 'ground'
    },
    archers: {
        id: 'archers',
        name: 'Archers',
        type: 'troop',
        hp: 304,
        damage: 107,
        hitSpeed: 0.9,
        loadTime: 1.1,
        speed: 1.0, // Medium
        range: 5.0,
        sightRange: 5.5,
        radius: 0.5,
        mass: 3,
        isAir: false,
        targetType: 'all',
        projectileSpeed: 10,
        spawnCount: 2,
        spawnRadius: 0.8
    },
    giant: {
        id: 'giant',
        name: 'Giant',
        type: 'troop',
        hp: 4091,
        damage: 254,
        hitSpeed: 1.5,
        loadTime: 1.0,
        speed: 0.75, // Slow
        range: 0.8,
        sightRange: 5.5,
        radius: 0.75,
        mass: 18,
        isAir: false,
        targetType: 'building',
        isBuildingTargeter: true
    },
    pekka: {
        id: 'pekka',
        name: 'P.E.K.K.A',
        type: 'troop',
        hp: 3760,
        damage: 816,
        hitSpeed: 1.8,
        loadTime: 1.3,
        speed: 0.75, // Slow
        range: 0.8,
        sightRange: 5.5,
        radius: 0.8,
        mass: 18,
        isAir: false,
        targetType: 'ground'
    },
    musketeer: {
        id: 'musketeer',
        name: 'Musketeer',
        type: 'troop',
        hp: 720,
        damage: 218,
        hitSpeed: 1.1,
        loadTime: 0.6,
        speed: 1.0, // Medium
        range: 6.0,
        sightRange: 6.0,
        radius: 0.5,
        mass: 4,
        isAir: false,
        targetType: 'all',
        projectileSpeed: 10
    },
    hog_rider: {
        id: 'hog_rider',
        name: 'Hog Rider',
        type: 'troop',
        hp: 1696,
        damage: 318,
        hitSpeed: 1.6,
        loadTime: 1.0,
        speed: 2.0, // Very Fast
        range: 0.8,
        sightRange: 5.5,
        radius: 0.6,
        mass: 8,
        isAir: false,
        targetType: 'building',
        isBuildingTargeter: true,
        jumpsRiver: true
    },
    skeletons: {
        id: 'skeletons',
        name: 'Skeletons',
        type: 'troop',
        hp: 81,
        damage: 81,
        hitSpeed: 1.0,
        loadTime: 0.5,
        speed: 1.5, // Fast
        range: 0.8,
        sightRange: 5.5,
        radius: 0.4,
        mass: 1,
        isAir: false,
        targetType: 'ground',
        spawnCount: 3,
        spawnRadius: 0.5
    },
    elite_barbarians: {
        id: 'elite_barbarians',
        name: 'Elite Barbarians',
        type: 'troop',
        hp: 1341,
        damage: 382,
        hitSpeed: 1.4,
        loadTime: 1.0,
        speed: 2.0, // Very Fast
        range: 0.8,
        sightRange: 5.5,
        radius: 0.5,
        mass: 6,
        isAir: false,
        targetType: 'ground',
        spawnCount: 2,
        spawnRadius: 0.8
    },
    evo_knight: {
        id: 'evo_knight',
        name: 'Evo Knight',
        type: 'troop',
        hp: 1999,
        damage: 202,
        hitSpeed: 1.2,
        loadTime: 0.7,
        speed: 1.0, // Medium
        range: 0.8,
        sightRange: 5.5,
        radius: 0.5,
        mass: 6,
        isAir: false,
        targetType: 'ground',
        movingShieldDamageReduction: 0.6 // 60% shield while moving
    },
    evo_skeletons: {
        id: 'evo_skeletons',
        name: 'Evo Skeletons',
        type: 'troop',
        hp: 81,
        damage: 81,
        loadTime: 0.5,
        hitSpeed: 1.0,
        speed: 1.5, // Fast
        range: 0.8,
        sightRange: 5.5,
        radius: 0.4,
        mass: 1,
        isAir: false,
        targetType: 'ground',
        spawnCount: 3,
        spawnRadius: 0.5,
        spawnOnHitId: 'evo_skeleton_single',
        maxClones: 8
    },
    evo_skeleton_single: {
        id: 'evo_skeleton_single',
        name: 'Evo Skeleton',
        type: 'troop',
        hp: 81,
        damage: 81,
        loadTime: 0.5,
        hitSpeed: 1.0,
        speed: 1.5, // Fast
        range: 0.8,
        sightRange: 5.5,
        radius: 0.4,
        mass: 1,
        isAir: false,
        targetType: 'ground',
        spawnOnHitId: 'evo_skeleton_single',
        maxClones: 8
    },
    golden_knight: {
        id: 'golden_knight',
        name: 'Golden Knight',
        type: 'troop',
        hp: 1800,
        damage: 160,
        loadTime: 0.5,
        hitSpeed: 0.9,
        speed: 1.0, // Medium
        range: 1.2,
        sightRange: 5.5,
        radius: 0.5,
        mass: 5,
        isAir: false,
        targetType: 'ground',
        ability: {
            name: 'Dashing Dash',
            cooldown: 11,
            elixirCost: 1,
            effect: 'dash',
            radius: 5.0
        }
    },
    archer_queen: {
        id: 'archer_queen',
        name: 'Archer Queen',
        type: 'troop',
        hp: 1000,
        damage: 225,
        hitSpeed: 1.2,
        loadTime: 0.5,
        speed: 1.0,
        range: 5.0,
        sightRange: 5.5,
        radius: 0.4,
        mass: 4,
        isAir: false,
        targetType: 'ground',
        ability: {
            name: 'Cloaking Cape',
            cooldown: 15,
            elixirCost: 1,
            effect: 'cloak',
            duration: 3.0
        }
    },    elite_knight: {
        id: 'elite_knight',
        name: 'Hero Knight',
        type: 'troop',
        hp: 1666, // Base stats same as normal knight
        damage: 202,
        loadTime: 0.5,
        hitSpeed: 1.2,
        speed: 1.0, // Medium
        range: 1.2,
        sightRange: 5.5,
        radius: 0.5,
        mass: 3,
        isAir: false,
        targetType: 'ground',
        ability: {
            name: 'Triumphant Taunt',
            cooldown: 25,
            elixirCost: 2,
            effect: 'taunt_shield',
            duration: 5.0,
            radius: 6.5 // Taunt radius
        }
    },
    elite_musketeer: {
        id: 'elite_musketeer',
        name: 'Hero Musketeer',
        type: 'troop',
        hp: 883, // Exactly 883 HP per Season 77
        damage: 204, // Ranged attack damage
        loadTime: 0.5,
        hitSpeed: 1.3, // 1.3s hit speed
        speed: 1.0, // Medium
        range: 6.0,
        sightRange: 6.0,
        radius: 0.5,
        mass: 4,
        isAir: false,
        targetType: 'all',
        projectileSpeed: 10,
        ability: {
            name: 'Trusty Turret',
            cooldown: 15,
            elixirCost: 3,
            effect: 'spawn_turret'
        }
    },
    elite_turret: {
        id: 'elite_turret',
        name: 'Elite Turret',
        type: 'building',
        hp: 350,
        damage: 100,
        loadTime: 0.5,
        hitSpeed: 1.0,
        speed: 0,
        range: 3.5, // 2026 Feb balance change
        sightRange: 3.5,
        radius: 0.6,
        mass: Infinity,
        isAir: false,
        targetType: 'all',
        projectileSpeed: 10,
        lifetime: 10
    },
    elite_giant: {
        id: 'elite_giant',
        name: 'Elite Giant',
        type: 'troop',
        hp: 4091, // Exactly same as 11级 Giant
        damage: 254,
        loadTime: 0.5,
        hitSpeed: 1.5,
        speed: 0.5, // Slow
        range: 1.2,
        sightRange: 5.5,
        radius: 0.8,
        mass: 8,
        isAir: false,
        targetType: 'building',
        isBuildingTargeter: true,
        ability: {
            name: 'Throw Enemies',
            cooldown: 12,
            elixirCost: 1,
            effect: 'throw_enemies',
            radius: 3.0
        }
    },
    battle_healer: {
        id: 'battle_healer',
        name: 'Battle Healer',
        type: 'troop',
        hp: 1584,
        damage: 135,
        hitSpeed: 1.5,
        loadTime: 0.5,
        speed: 1.0, // Medium
        range: 0.8,
        sightRange: 5.5,
        radius: 0.6,
        mass: 6,
        isAir: false,
        targetType: 'ground'
    },
    princess_tower: {
        id: 'princess_tower',
        name: 'Princess Tower',
        type: 'tower',
        hp: 2534,
        damage: 90,
        hitSpeed: 0.8,
        loadTime: 0.1,
        speed: 0,
        range: 7.5,
        sightRange: 7.5,
        radius: 1.5,
        mass: Infinity,
        isAir: false,
        targetType: 'all',
        projectileSpeed: 10
    },
    king_tower: {
        id: 'king_tower',
        name: 'King Tower',
        type: 'tower',
        hp: 4008,
        damage: 90,
        hitSpeed: 1.0,
        loadTime: 0.2,
        speed: 0,
        range: 7.0,
        sightRange: 7.0,
        radius: 2.0,
        mass: Infinity,
        isAir: false,
        targetType: 'all',
        projectileSpeed: 10
    }
};
