/**
 * Canvas setup and isometric drawing utilities.
 */

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
}
resize();
window.addEventListener('resize', resize);

/**
 * Convert world coordinates (0..1, 0..1) to screen pixel coordinates.
 */
function worldToScreen(wx, wy) {
    const cx = W * 0.5, cy = H * 0.52;
    const tileW = W * 0.06, tileH = tileW * 0.5;
    const N = 7;
    const gx = (wx - 0.5) * N * 2;
    const gy = (wy - 0.5) * N * 2;
    return { sx: cx + (gx - gy) * tileW, sy: cy + (gx + gy) * tileH };
}

/**
 * Convert screen pixel coordinates back to world coordinates (0..1, 0..1).
 */
function screenToWorld(sx, sy) {
    const cx = W * 0.5, cy = H * 0.52;
    const tileW = W * 0.06, tileH = tileW * 0.5;
    const N = 7;
    const a = (sx - cx) / tileW; // gx - gy
    const b = (sy - cy) / tileH; // gx + gy
    const gx = (a + b) / 2;
    const gy = (b - a) / 2;
    const wx = gx / (N * 2) + 0.5;
    const wy = gy / (N * 2) + 0.5;
    return { wx, wy };
}

/**
 * Draw the isometric floor grid.
 */
function drawFloor() {
    const N = 8;
    const cx = W * 0.5, cy = H * 0.52;
    const tileW = W * 0.06, tileH = tileW * 0.5;
    for (let gy = -N; gy < N; gy++) {
        for (let gx = -N; gx < N; gx++) {
            const sx = cx + (gx - gy) * tileW;
            const sy = cy + (gx + gy) * tileH;
            ctx.beginPath();
            ctx.moveTo(sx, sy - tileH);
            ctx.lineTo(sx + tileW, sy);
            ctx.lineTo(sx, sy + tileH);
            ctx.lineTo(sx - tileW, sy);
            ctx.closePath();
            ctx.fillStyle = (gx + gy) % 2 === 0 ? 'rgba(0,0,0,0.025)' : 'rgba(0,0,0,0.015)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.055)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }
}

export { canvas, ctx, W, H, resize, worldToScreen, screenToWorld, drawFloor };

// Re-export W and H as getters since they change on resize
export function getW() { return W; }
export function getH() { return H; }
