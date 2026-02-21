/**
 * Canvas animation engine — can be initialized on any canvas element.
 * Exports a factory function instead of hardcoded DOM binding.
 */

export function createEngine(canvasEl) {
    const ctx = canvasEl.getContext('2d');
    let W, H;

    // Use devicePixelRatio for sharp rendering on mobile
    function resize() {
        W = canvasEl.width = canvasEl.offsetWidth;
        H = canvasEl.height = canvasEl.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Tile size: use min(W,H) so tiles look the same on any orientation
    function getTileW() { return Math.max(W, H) * 0.018; }

    function worldToScreen(wx, wy) {
        const cx = W * 0.5, cy = H * 0.5;
        const tileW = getTileW(), tileH = tileW * 0.5;
        const N = 14;
        const gx = (wx - 0.5) * N * 2;
        const gy = (wy - 0.5) * N * 2;
        return { sx: cx + (gx - gy) * tileW, sy: cy + (gx + gy) * tileH };
    }

    function screenToWorld(sx, sy) {
        const cx = W * 0.5, cy = H * 0.5;
        const tileW = getTileW(), tileH = tileW * 0.5;
        const N = 14;
        const a = (sx - cx) / tileW;
        const b = (sy - cy) / tileH;
        const gx = (a + b) / 2;
        const gy = (b - a) / 2;
        const wx = gx / (N * 2) + 0.5;
        const wy = gy / (N * 2) + 0.5;
        return { wx, wy };
    }

    function drawFloor() {
        const cx = W * 0.5, cy = H * 0.5;
        const tileW = getTileW(), tileH = tileW * 0.5;
        // Calculate N so the grid fully covers the viewport (even in portrait)
        const diagH = H / tileH;   // how many tile-heights fit vertically
        const diagW = W / tileW;   // how many tile-widths fit horizontally
        const N = Math.ceil(Math.max(diagH, diagW) / 2) + 2;
        for (let gy = -N; gy < N; gy++) {
            for (let gx = -N; gx < N; gx++) {
                const sx = cx + (gx - gy) * tileW;
                const sy = cy + (gx + gy) * tileH;
                // Skip tiles fully outside viewport
                if (sx < -tileW * 2 || sx > W + tileW * 2 || sy < -tileH * 2 || sy > H + tileH * 2) continue;
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

    function getW() { return W; }
    function getH() { return H; }

    // Responsive sprite scale — smaller on narrow screens
    function getSpriteScale() {
        return W < 600 ? 0.15 : 0.26;
    }

    return { canvas: canvasEl, ctx, resize, worldToScreen, screenToWorld, drawFloor, getW, getH, getSpriteScale };
}
