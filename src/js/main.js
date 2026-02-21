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

function handleSubmit(e) {
    e.preventDefault();
    const input = e.target.querySelector('input[type="email"]');
    const email = input.value.trim();

    if (!email) return;

    // TODO: connect to backend API
    console.log('Email submitted:', email);

    input.value = '';
    input.placeholder = 'Дякуємо! Ми зв\'яжемось ✓';
    input.disabled = true;

    const btn = e.target.querySelector('.btn');
    if (btn) {
        btn.textContent = 'ГОТОВО ✓';
        btn.style.backgroundColor = '#16a34a';
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
