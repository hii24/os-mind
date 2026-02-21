/**
 * Bootstrap animation on any canvas element.
 * Usage: import { startAnimation } from './bootstrap.js';
 *        startAnimation(canvasElement);
 */
import { createEngine } from './engine.js';
import { SPRITES } from './sprites.js';
import { Char } from './character.js';

export function startAnimation(canvasEl) {
    const engine = createEngine(canvasEl);
    const { ctx, drawFloor, worldToScreen, screenToWorld, getW, getH } = engine;

    // --- INSTANT PLACEHOLDER RENDER ---
    // Draw the floor grid immediately so the user doesn't see an empty screen
    // while waiting several seconds for the character sprites to load.
    const W = getW();
    const H = getH();
    ctx.clearRect(0, 0, W, H);
    drawFloor();

    const foodItems = [];

    // Click to place food
    canvasEl.addEventListener('click', e => {
        const rect = canvasEl.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const { wx, wy } = screenToWorld(sx, sy);
        foodItems.push({ wx, wy, alive: true, age: 0 });
    });

    // Load sprites
    const loaded = {};

    function loadAll(onSpriteLoaded) {
        const entries = Object.entries(SPRITES);
        const total = entries.length;
        let currentIndex = 0;

        function processNextSprite() {
            if (currentIndex >= total) return;

            const [key, data] = entries[currentIndex];
            const img = new Image();
            img.onload = () => {
                const frameCount = Math.round(img.width / img.height);
                const fw = Math.round(img.width / frameCount);
                const fh = img.height;
                const frames = [];

                let currentFrameIndex = 0;

                function processNextFrame() {
                    for (let batch = 0; batch < 2; batch++) {
                        if (currentFrameIndex >= frameCount) {
                            loaded[key] = { frames, fw, fh };
                            onSpriteLoaded(); // Alert that THIS sprite is ready

                            currentIndex++;
                            setTimeout(processNextSprite, 0);
                            return;
                        }

                        const i = currentFrameIndex;
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

                        currentFrameIndex++;
                    }
                    setTimeout(processNextFrame, 0);
                }

                processNextFrame();
            };
            img.onerror = () => {
                console.warn(`Failed to load sprite: ${data.src}`);
                currentIndex++;
                setTimeout(processNextSprite, 0);
            };
            img.src = data.src;
        }

        processNextSprite();
    }

    function drawFood() {
        for (const food of foodItems) {
            if (!food.alive) continue;
            const { sx, sy } = worldToScreen(food.wx, food.wy);
            const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.005);
            const r = 5 * pulse;

            ctx.beginPath();
            ctx.ellipse(sx, sy + 2, r + 2, 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(sx, sy - 1, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(30,30,30,0.9)';
            ctx.fill();
        }
    }

    let chars = [];

    function loop() {
        const W = getW();
        const H = getH();
        ctx.clearRect(0, 0, W, H);
        drawFloor();
        drawFood();

        chars.sort((a, b) => a.wy - b.wy);

        for (const c of chars) {
            c.update();
            c.draw(false);
        }

        for (let i = foodItems.length - 1; i >= 0; i--) {
            foodItems[i].age++;
            if (foodItems[i].age > 600) foodItems[i].alive = false;
            if (!foodItems[i].alive) foodItems.splice(i, 1);
        }

        requestAnimationFrame(loop);
    }

    // Start rendering the loop immediately (background & food)
    loop();

    // Spawn characters incrementally as they finish loading
    loadAll(() => {
        const c = new Char(loaded, engine);
        c.foodItems = foodItems;
        chars.push(c);
    });
}
