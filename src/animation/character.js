/**
 * NPC Character class with social behavior, food-seeking, and all 25 animations.
 * Facing direction uses isometric screen-space projection for correctness.
 */


export class Char {
    constructor(loaded, engine) {
        this.loaded = loaded;
        this.engine = engine;
        this.wx = 0.15 + Math.random() * 0.7;
        this.wy = 0.15 + Math.random() * 0.7;
        this.z = 0;
        this.vz = 0;
        this.right = Math.random() > 0.5;
        this.state = 'walking';
        this.frame = Math.floor(Math.random() * 12);
        this.tick = Math.floor(Math.random() * 40);
        this.baseSpeed = 0.0006 + Math.random() * 0.0006;
        this.delay = 6 + Math.floor(Math.random() * 3);
        this.swimTimer = 0;
        this.actionTimer = 0;
        this.dvx = 0;
        this.dvy = 0;
        this.dirTimer = 0;



        // Food
        this.foodItems = null;
        this.targetFood = null;

        this.pickNewDir();
    }

    /**
     * Update facing direction based on movement in isometric screen-space.
     * In iso projection, screen-x ∝ (dvx - dvy), so we face right when dvx > dvy.
     */
    updateFacing() {
        const screenDx = this.dvx - this.dvy;
        if (Math.abs(screenDx) > 0.00001) {
            this.right = screenDx > 0;
        }
    }

    pickNewDir() {
        const angle = Math.random() * Math.PI * 2;
        this.dvx = Math.cos(angle) * this.baseSpeed;
        this.dvy = Math.sin(angle) * this.baseSpeed;
        this.updateFacing();
        this.dirTimer = 200 + Math.floor(Math.random() * 400);
    }

    walkToward(tx, ty, speed) {
        const dx = tx - this.wx;
        const dy = ty - this.wy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.001) return 0;
        this.dvx = (dx / dist) * speed;
        this.dvy = (dy / dist) * speed;
        this.updateFacing();
        return dist;
    }



    findNearestFood() {
        if (!this.foodItems) return null;
        let best = null;
        let bestDist = Infinity;
        for (const food of this.foodItems) {
            if (!food.alive) continue;
            const dx = food.wx - this.wx;
            const dy = food.wy - this.wy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestDist) {
                bestDist = d;
                best = food;
            }
        }
        return best;
    }

    spr() {
        return this.loaded[this.state];
    }

    go(s) {
        if (this.state === s) return;
        this.state = s;
        this.frame = 0;
        this.tick = 0;
    }

    stepFrame(loop = true) {
        const sp = this.spr();
        if (!sp) return;
        this.tick++;
        if (this.tick >= this.delay) {
            this.tick = 0;
            if (loop) {
                this.frame = (this.frame + 1) % sp.frames.length;
            } else if (this.frame < sp.frames.length - 1) {
                this.frame++;
            }
        }
    }

    /** Clamp position within hard boundaries (full visible screen) */
    clampPos() {
        this.wx = Math.max(-0.5, Math.min(1.5, this.wx));
        this.wy = Math.max(-0.5, Math.min(1.5, this.wy));
    }

    /** Bounce off soft boundaries during normal walking */
    bounceEdges() {
        if (this.wx < 0.05 || this.wx > 0.95) {
            this.dvx *= -1;
            this.updateFacing();
        }
        if (this.wy < 0.05 || this.wy > 0.95) {
            this.dvy *= -1;
            this.updateFacing();
        }
        this.wx = Math.max(0, Math.min(1, this.wx));
        this.wy = Math.max(0, Math.min(1, this.wy));
    }

    /** Choose a random jump type */
    randomJump() {
        const jumps = [
            'upward_jump', 'jumping', 'double_jump', 'side_jump',
            'obstacle_jump', 'platform_jump', 'jump_with_strike', 'gliding_jump'
        ];
        return jumps[Math.floor(Math.random() * jumps.length)];
    }

    update() {
        // --- Priority: check for food at any time (except eating/chasing/mid-air) ---
        if (this.state !== 'eating' && this.state !== 'hungry' &&
            this.state !== 'falling' && this.z === 0) {
            const food = this.findNearestFood();
            if (food && food.alive) {
                this.targetFood = food;
                this.go('hungry');
            }
        }

        switch (this.state) {
            // ==================== WALKING ====================
            case 'walking':
                this.stepFrame(true);
                this.wx += this.dvx;
                this.wy += this.dvy;
                this.bounceEdges();
                this.dirTimer--;
                if (this.dirTimer <= 0) this.pickNewDir();

                // Idle pause
                if (Math.random() < 0.0008) {
                    this.go('idle_pause');
                    this.actionTimer = 60 + Math.floor(Math.random() * 100);
                    break;
                }

                // Random transitions to ALL animation types
                if (Math.random() < 0.0003) {
                    const jt = this.randomJump();
                    this.vz = jt === 'double_jump' ? -10 : -7;
                    this.go(jt);
                }
                else if (Math.random() < 0.00015) {
                    this.go('running');
                    this.actionTimer = 80 + Math.floor(Math.random() * 100);
                }
                else if (Math.random() < 0.0001) {
                    this.go('speed_boost_running');
                    this.actionTimer = 50 + Math.floor(Math.random() * 60);
                }
                else if (Math.random() < 0.0001) {
                    this.go('swimming_dive');
                    this.actionTimer = 30;
                    this.swimTimer = 200;
                }
                else if (Math.random() < 0.00008) { this.go('wall_climbing'); }
                else if (Math.random() < 0.00008) {
                    this.go('crawl');
                    this.actionTimer = 80 + Math.floor(Math.random() * 80);
                }
                else if (Math.random() < 0.00006) {
                    this.go('roll');
                    this.actionTimer = 45;
                }
                else if (Math.random() < 0.00008) {
                    this.go('climbing_ladder');
                    this.actionTimer = 60 + Math.floor(Math.random() * 80);
                }
                else if (Math.random() < 0.00005) {
                    this.go('leap');
                    this.vz = -5;
                    this.actionTimer = 50;
                }
                break;

            // ==================== FOOD CHASE ====================
            case 'hungry': {
                const food = this.targetFood;
                if (!food || !food.alive) {
                    this.targetFood = null;
                    this.pickNewDir();
                    this.go('walking');
                    break;
                }
                const runSpeed = this.baseSpeed * 4;
                const dist = this.walkToward(food.wx, food.wy, runSpeed);
                // Use speed_boost_running sprite for food chase
                this.state = 'speed_boost_running';
                this.stepFrame(true);
                this.state = 'hungry';
                this.wx += this.dvx;
                this.wy += this.dvy;
                this.clampPos();

                if (dist < 0.025) {
                    if (food.alive) {
                        food.alive = false;
                        this.targetFood = null;
                        this.go('eating');
                        this.actionTimer = 50 + Math.floor(Math.random() * 30);
                    } else {
                        this.targetFood = null;
                        this.pickNewDir();
                        this.go('walking');
                    }
                }
                break;
            }

            case 'eating':
                this.state = 'crouch';
                this.stepFrame(true);
                this.state = 'eating';
                this.actionTimer--;
                if (this.actionTimer <= 0) {
                    this.pickNewDir();
                    this.go('walking');
                }
                break;


            case 'idle_pause':
                this.actionTimer--;
                if (this.actionTimer <= 0) {
                    this.pickNewDir();
                    this.go('walking');
                }
                break;

            // ==================== RUNNING ====================
            case 'running':
                this.stepFrame(true);
                this.wx += this.dvx * 1.6;
                this.wy += this.dvy * 1.6;
                this.bounceEdges();
                this.actionTimer--;
                if (this.actionTimer <= 0) { this.go('stop_running'); this.actionTimer = 25; }
                break;

            case 'speed_boost_running':
                this.stepFrame(true);
                this.wx += this.dvx * 2.2;
                this.wy += this.dvy * 2.2;
                this.bounceEdges();
                this.actionTimer--;
                if (this.actionTimer <= 0) { this.go('stop_running'); this.actionTimer = 25; }
                break;

            case 'stop_running':
                this.stepFrame(false);
                this.actionTimer--;
                if (this.actionTimer <= 0) { this.pickNewDir(); this.go('walking'); }
                break;

            // ==================== GROUND MOVES ====================
            case 'crawl':
                this.stepFrame(true);
                this.wx += this.dvx * 0.25;
                this.wy += this.dvy * 0.25;
                this.bounceEdges();
                this.actionTimer--;
                if (this.actionTimer <= 0) { this.pickNewDir(); this.go('walking'); }
                break;

            case 'roll':
                this.stepFrame(true);
                this.wx += this.dvx * 1.2;
                this.wy += this.dvy * 0.4;
                this.clampPos();
                this.actionTimer--;
                if (this.actionTimer <= 0) { this.pickNewDir(); this.go('walking'); }
                break;

            // ==================== ALL JUMP TYPES ====================
            case 'upward_jump':
            case 'jumping':
            case 'double_jump':
            case 'side_jump':
            case 'obstacle_jump':
            case 'platform_jump':
            case 'jump_with_strike':
            case 'gliding_jump':
                this.stepFrame(false);
                this.wx += this.dvx * 0.5;
                this.wy += this.dvy * 0.5;
                this.z += this.vz;
                this.vz += 0.40;
                // Switch to falling sprite on the way down
                if (this.vz > 0 && this.z < -10) {
                    this.go('falling');
                }
                if (this.z >= 0) {
                    this.z = 0; this.vz = 0;
                    this.go(this.state === 'double_jump' ? 'landing_impact' : 'landing');
                    this.actionTimer = 18;
                }
                this.clampPos();
                break;

            case 'falling':
                this.stepFrame(true);
                this.wx += this.dvx * 0.3;
                this.wy += this.dvy * 0.3;
                this.z += this.vz;
                this.vz += 0.40;
                if (this.z >= 0) {
                    this.z = 0; this.vz = 0;
                    this.go('landing_impact');
                    this.actionTimer = 20;
                }
                this.clampPos();
                break;

            case 'leap':
                this.stepFrame(false);
                this.wx += this.dvx * 1.6;
                this.wy += this.dvy * 0.4;
                this.z += this.vz; this.vz += 0.32;
                if (this.vz > 0 && this.z < -8) {
                    this.go('falling');
                }
                if (this.z >= 0) {
                    this.z = 0; this.vz = 0;
                    this.go('landing');
                    this.actionTimer = 18;
                }
                this.clampPos();
                break;

            case 'landing':
            case 'landing_impact':
                this.stepFrame(false);
                this.actionTimer--;
                if (this.actionTimer <= 0) { this.pickNewDir(); this.go('walking'); }
                break;

            // ==================== SWIMMING ====================
            case 'swimming_dive':
                this.stepFrame(false);
                this.z -= 3;
                this.wx += this.dvx * 0.3;
                this.wy += this.dvy * 0.1;
                this.clampPos();
                this.actionTimer--;
                if (this.actionTimer <= 0 || this.z < -50) {
                    this.go('swimming');
                }
                break;

            case 'swimming':
                this.swimTimer--;
                this.stepFrame(true);
                this.wx += this.dvx * 0.5;
                this.wy += this.dvy * 0.15;
                this.z = -50 + Math.sin(Date.now() * 0.0012 + this.wx * 10) * 18;
                this.bounceEdges();
                if (this.swimTimer <= 0) { this.z = 0; this.go('walking'); }
                break;

            // ==================== CLIMBING ====================
            case 'wall_climbing':
                this.stepFrame(true);
                this.z -= 1.4;
                if (this.z < -60 || Math.random() < 0.007) {
                    this.vz = -3;
                    this.dvx = (this.right ? -1 : 1) * this.baseSpeed * 1.8;
                    this.right = !this.right;
                    this.go('wall_jump');
                }
                break;

            case 'wall_jump':
                this.stepFrame(false);
                this.wx += this.dvx; this.wy += this.dvy * 0.3;
                this.z += this.vz; this.vz += 0.35;
                if (this.z >= 0) {
                    this.z = 0; this.vz = 0;
                    this.pickNewDir();
                    this.go('walking');
                }
                this.clampPos();
                break;

            case 'climbing_ladder':
                this.stepFrame(true);
                this.z -= 1.0;
                this.actionTimer--;
                if (this.actionTimer <= 0 || this.z < -70) {
                    this.go('descending_ladder');
                    this.actionTimer = 70;
                }
                break;

            case 'descending_ladder':
                this.stepFrame(true);
                this.z += 1.0;
                this.actionTimer--;
                if (this.z >= 0 || this.actionTimer <= 0) {
                    this.z = 0;
                    this.pickNewDir();
                    this.go('walking');
                }
                break;

            // ==================== DEFAULT ====================
            default:
                this.stepFrame(false);
                this.actionTimer--;
                if (this.actionTimer <= 0) { this.pickNewDir(); this.go('walking'); }
                break;
        }
    }

    draw() {
        // Map internal states to sprite keys for drawing
        let drawState = this.state;
        if (drawState === 'idle_pause') {
            drawState = 'walking';
        }
        if (drawState === 'hungry') {
            drawState = 'speed_boost_running';
        }
        if (drawState === 'eating') {
            drawState = 'crouch';
        }

        const sp = this.loaded[drawState];
        if (!sp) return;

        const frameIdx = (drawState !== this.state)
            ? (this.state === 'idle_pause' ? 0 : this.frame % sp.frames.length)
            : this.frame;
        const fr = sp.frames[frameIdx] || sp.frames[0];
        if (!fr) return;

        const { worldToScreen, ctx } = this.engine;
        const { sx, sy } = worldToScreen(this.wx, this.wy);
        const depthScale = 0.45 + this.wy * 0.75;
        const sc = depthScale * this.engine.getSpriteScale();
        const w = sp.fw * sc;
        const h = sp.fh * sc;
        const screenZ = this.z * depthScale * 0.55;

        ctx.save();
        ctx.translate(sx, sy + screenZ);
        ctx.transform(1, 0, -0.07, 0.92, 0, 0);
        if (!this.right) ctx.scale(-1, 1);

        // Shadow
        const ss = Math.max(0, 1 - Math.abs(this.z) * 0.005);
        ctx.beginPath();
        ctx.ellipse(0, -screenZ + 3, w * 0.26 * ss, 4 * ss, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${0.1 * ss})`;
        ctx.fill();

        ctx.drawImage(fr, -w / 2, -h, w, h);
        ctx.restore();


    }
}
