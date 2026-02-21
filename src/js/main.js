/**
 * Landing page JS — email form, counter animation, NPC background
 */
import '../scss/main.scss';
import { startAnimation } from '../animation/bootstrap.js';

// ─── Start NPC animation on fixed background canvas ───
const npcCanvas = document.getElementById('npc-canvas');
if (npcCanvas) {
    // Defer animation startup so the main UI renders instantly
    setTimeout(() => {
        startAnimation(npcCanvas);
    }, 100);
}

// ─── Email form submission ───
const form = document.getElementById('waitlist-form');
const heroForm = document.getElementById('hero-form');

let isFirebaseLoading = false;

async function handleSubmit(e) {
    e.preventDefault();
    const input = e.target.querySelector('input[type="email"]');
    const email = input.value.trim();
    const btn = e.target.querySelector('.btn');

    if (!email) return;

    // Optional UI Feedback - indicate that we are processing
    if (btn) {
        btn.textContent = 'ОБРОБКА...';
        btn.disabled = true;
    }
    input.disabled = true;

    try {
        isFirebaseLoading = true;
        // Dynamically import Firebase only when the user submits
        // This keeps the initial page load bundle extremely small!
        const { addEmailToWaitlist } = await import('./firebaseInit.js');
        const success = await addEmailToWaitlist(email);

        if (success) {
            input.value = '';
            input.placeholder = 'Дякуємо! Ви у списку ✓';

            // Hide the submit button and checkbox to make it look clean
            if (btn) btn.style.display = 'none';
            const checkboxContainer = e.target.querySelector('.consent-checkbox');
            if (checkboxContainer) checkboxContainer.style.display = 'none';
        } else {
            throw new Error('Failed to add to database');
        }
    } catch (err) {
        console.error('Submission error:', err);
        input.disabled = false;
        if (btn) {
            btn.textContent = 'ПОМИЛКА. СПРОБУВАТИ ЩЕ';
            btn.disabled = false;
        }
    } finally {
        isFirebaseLoading = false;
    }
}

if (form) form.addEventListener('submit', handleSubmit);
if (heroForm) heroForm.addEventListener('submit', handleSubmit);

// ─── Counter animation on scroll ───
function animateCounter() {
    const digits = document.querySelectorAll('.counter__digit span');
    if (!digits.length) return;

    const target = [0, 4, 5, 2];
    let frame = 0;
    const totalFrames = 30;

    const interval = setInterval(() => {
        frame++;
        digits.forEach((digit, i) => {
            if (frame < totalFrames) {
                digit.textContent = Math.floor(Math.random() * 10);
            } else {
                digit.textContent = target[i];
            }
        });
        if (frame >= totalFrames) clearInterval(interval);
    }, 50);
}

// Trigger counter animation when visible
const counterEl = document.querySelector('.counter');
if (counterEl) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter();
                    observer.disconnect();
                }
            });
        },
        { threshold: 0.5 }
    );
    observer.observe(counterEl);
}
