export const CONFIG = {
    TICKS_PER_SECOND: 60,
    ARENA_WIDTH: 18,
    ARENA_HEIGHT: 32, // Or 33 depending on bounds, playable area is ~32
    TILE_SIZE: 1, // logical units
    RIVER_Y_START: 15,
    RIVER_Y_END: 17,
    BRIDGE_WIDTH: 2,
    LEFT_BRIDGE_X: 2, // Center is 3 (aligns with left Princess Tower)
    RIGHT_BRIDGE_X: 14, // Center is 15 (aligns with right Princess Tower)
};

// Unit speeds in tiles per second
export const SPEEDS = {
    SLOW: 0.75,
    MEDIUM: 1.0,
    FAST: 1.5,
    VERY_FAST: 2.0,
};
