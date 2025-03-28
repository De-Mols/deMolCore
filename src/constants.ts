// Animation and interaction constants
export const HOVER_DURATION = 500;
export const LONG_TOUCH_DURATION = 1000;
export const ANIMATION_INTERVAL = 100;

// Camera and view constants
export const CAMERA_FAR = 800;
export const CAMERA_Z = 150;
export const CAMERA_NEAR = 100;
export const CAMERA_FOG_FAR = 200;

// Math constants
export const DEGREES_TO_RADIANS = Math.PI / 180.0;
export const NEAR_ZERO = -0.0001;
export const NEAR_ONE = 1.0001;
export const ROTATION_THRESHOLD = 0.9995;

// Volume and rendering constants
export const MAX_VOLUME = 64000;
export const TRANSFER_BUFFER_SIZE = 256;
export const WHEEL_DELTA_FACTOR = 600;
export const ZOOM_FACTOR = 400;
export const SLAB_ADJUSTMENT_FACTOR = 100;

// Color constants
export const WHITE_RGB = {
    r: 255,
    g: 255,
    b: 255
};

// Units conversion
export const BOHR_TO_ANGSTROM = 0.529177;
export const ANGSTROM_TO_BOHR = 1 / BOHR_TO_ANGSTROM;

// Canvas dimensions
export const LABEL_CANVAS_WIDTH = 134;

// Bit mask constants
export const BIT_MASK_128 = 128;
export const BIT_MASK_256 = 256;
export const BIT_MASK_512 = 512;
export const BIT_MASK_1024 = 1024;
export const BIT_MASK_2048 = 2048;

// Surface constants
export const SURFACE_IN_OUT = 1;
export const SURFACE_IS_DONE = 2;
export const SURFACE_IS_BOUND = 4;
export const PROBE_RADIUS = 1.4;
export const DEFAULT_SCALE_FACTOR = 2;

// Viewer constants
export const NUM_WORKERS = 4;
export const DEFAULT_FOV = 20;
export const FOG_START = 0.4;
export const DEFAULT_SLAB_NEAR = -50;
export const DEFAULT_SLAB_FAR = 50;

// Rendering constants
export const DEFAULT_SUBSAMPLES = 5.0; 