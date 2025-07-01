// terminal-waves.js
// Adapted from WavyWavesBg.js to render ASCII art in the terminal.

import tinygradient from 'tinygradient';

// --- Argument Parsing ---
const args = process.argv.slice(2);
let customAsciiRamp = ' .:-=+*#%@';
let gradientColors = ['#ff0000', '#00ff00', '#0000ff']; // Default: Red, Green, Blue

const asciiFlagIndex = args.indexOf('--ascii');
if (asciiFlagIndex !== -1 && args[asciiFlagIndex + 1]) {
    customAsciiRamp = args[asciiFlagIndex + 1];
}

const colorsFlagIndex = args.indexOf('--colors');
if (colorsFlagIndex !== -1 && args[colorsFlagIndex + 1]) {
    gradientColors = args[colorsFlagIndex + 1].split(',');
}

// --- Configuration ---
const WIDTH = process.stdout.columns || 80;
const HEIGHT = process.stdout.rows || 24;
const FRAME_RATE = 30; // Frames per second

const ASCII_RAMP = customAsciiRamp;
const gradient = tinygradient(gradientColors);

// --- Ported Shader Logic ---
function f(p, time) {
    return Math.sin(p.x + Math.sin(p.y + time)) * Math.sin(p.y * p.x * 0.1 + time);
}

function field(p, time) {
    const ep = { x: 0.05, y: 0.0 };
    let rz = { x: 0, y: 0 };

    for (let i = 0; i < 7; i++) {
        const t0 = f(p, time);
        const t1 = f({ x: p.x + ep.x, y: p.y + ep.y }, time);
        const t2 = f({ x: p.x + ep.y, y: p.y + ep.x }, time);

        const g = { x: (t1 - t0) / ep.x, y: (t2 - t0) / ep.x };
        const t = { x: -g.y, y: g.x };

        p.x += 0.9 * t.x + g.x * 0.3;
        p.y += 0.9 * t.y + g.y * 0.3;
        rz = t;
    }
    return rz;
}

// --- Main Application ---
let time = 0;
const u_scale = 10;

function renderFrame() {
    let frameBuffer = '';
    const aspectRatio = WIDTH / HEIGHT;
    const colors = gradient.rgb(WIDTH * HEIGHT);

    for (let j = 0; j < HEIGHT; j++) {
        for (let i = 0; i < WIDTH; i++) {
            const p = {
                x: (i / WIDTH - 0.5) * aspectRatio,
                y: j / HEIGHT - 0.5
            };

            p.x *= u_scale;
            p.y *= u_scale;

            const fld = field(p, time);
            let factor = (1.0 - fld.y) * (0.5 - fld.x);
            factor = Math.max(0.0, Math.min(1.0, factor));

            const charIndex = Math.floor(factor * (ASCII_RAMP.length - 1));
            const char = ASCII_RAMP[charIndex];

            const color = gradient.rgbAt(factor);
            frameBuffer += `\x1b[38;2;${Math.round(color._r)};${Math.round(color._g)};${Math.round(color._b)}m${char}`;
        }
        if (j < HEIGHT - 1) {
            frameBuffer += '\n';
        }
    }

    process.stdout.write('\x1Bc');
    process.stdout.write(frameBuffer);
}

import readline from 'readline';

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c' || key.name === 'q') {
        process.exit();
    }
});

function start() {
    console.log("Starting ASCII wave animation. Press Ctrl+C to exit.");
    console.log("Use --ascii '<chars>' to set a custom character ramp.");
    console.log("Use --colors '<color1>,<color2>,...' to set a custom gradient.");
    setInterval(() => {
        time += 0.05;
        renderFrame();
    }, 1000 / FRAME_RATE);
}

start();
