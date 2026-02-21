/**
 * Main entry point — click-to-feed mechanic, sprite loading, game loop.
 * No player character — only NPCs that can be "fed" by clicking.
 */
import { SPRITES } from './sprites.js';
import { canvas, ctx, drawFloor, screenToWorld, worldToScreen, getW, getH } from './utils.js';
import { Char } from './character.js';

// ---- FOOD ITEMS ----
// Each food item: { wx, wy, alive: true, age: 0 }
const foodItems = [];

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { wx, wy } = screenToWorld(sx, sy);
    // Place food anywhere on the visible area
    foodItems.push({ wx, wy, alive: true, age: 0 });
});

// ---- LOAD SPRITES ----
const loaded = {};

function loadAll(cb) {
    let done = 0;
    const entries = Object.entries(SPRITES);
    const total = entries.length;

    for (const [key, data] of entries) {
        const img = new Image();
        img.onload = () => {
            const frameCount = Math.round(img.width / img.height);
            const fw = Math.round(img.width / frameCount);
            const fh = img.height;
            const frames = [];

            for (let i = 0; i < frameCount; i++) {
                const fc = document.createElement('canvas');
                fc.width = fw;
                fc.height = fh;
                const fx = fc.getContext('2d');
                fx.drawImage(img, -i * fw, 0);

                const id = fx.getImageData(0, 0, fw, fh);
                const d = id.data;
                for (let p = 0; p < d.length; p += 4) {
                    const br = (d[p] + d[p + 1] + d[p + 2]) / 3;
                    if (br < 18) {
                        d[p + 3] = 0;
                    } else {
                        d[p] = 0;
                        d[p + 1] = 0;
                        d[p + 2] = 0;
                        d[p + 3] = br < 55 ? Math.floor(((br - 18) / 37) * 255) : 255;
                    }
                }
                fx.putImageData(id, 0, 0);
                frames.push(fc);
            }

            loaded[key] = { frames, fw, fh };
            if (++done === total) cb();
        };
        img.onerror = () => {
            console.warn(`Failed to load sprite: ${data.src}`);
            if (++done === total) cb();
        };
        img.src = data.src;
    }
}


// ---- DRAW FOOD ----
function drawFood() {
    for (const food of foodItems) {
        if (!food.alive) continue;
        const { sx, sy } = worldToScreen(food.wx, food.wy);

        // Pulsing black dot
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.005);
        const r = 5 * pulse;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, r + 2, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(sx, sy - 1, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30,30,30,0.9)';
        ctx.fill();
    }
}

// ---- MAIN ----
let chars = [];

function loop() {
    const W = getW();
    const H = getH();
    ctx.clearRect(0, 0, W, H);
    drawFloor();

    drawFood();

    // Sort by wy for depth
    chars.sort((a, b) => a.wy - b.wy);

    for (const c of chars) {
        c.update();
        c.draw(false);
    }

    // Age and clean up food items
    for (let i = foodItems.length - 1; i >= 0; i--) {
        foodItems[i].age++;
        // Auto-expire food after ~10 seconds (600 frames)
        if (foodItems[i].age > 600) foodItems[i].alive = false;
        if (!foodItems[i].alive) foodItems.splice(i, 1);
    }

    requestAnimationFrame(loop);
}

loadAll(() => {
    for (let i = 0; i < 20; i++) {
        chars.push(new Char(loaded));
    }
    // Give each NPC references
    for (const c of chars) {
        c.allChars = chars;
        c.foodItems = foodItems;
    }

    loop();
});
