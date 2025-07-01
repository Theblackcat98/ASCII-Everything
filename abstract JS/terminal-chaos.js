// terminal-chaos.js
// Adapted from ChaosWavesBg.js to render ASCII art in the terminal.

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
function mtx_mult(m, p) {
    return {
        x: m[0][0] * p.x + m[0][1] * p.y,
        y: m[1][0] * p.x + m[1][1] * p.y
    };
}

function rand(n) {
    return (Math.sin(n.x * 12.9898 + n.y * 4.1414) * 43758.5453) % 1;
}

function noise(p) {
    const ip = { x: Math.floor(p.x), y: Math.floor(p.y) };
    let u = { x: p.x - ip.x, y: p.y - ip.y };
    u.x = u.x * u.x * (3.0 - 2.0 * u.x);
    u.y = u.y * u.y * (3.0 - 2.0 * u.y);

    const mix = (a, b, t) => a * (1 - t) + b * t;

    const res = mix(
        mix(rand(ip), rand({ x: ip.x + 1.0, y: ip.y }), u.x),
        mix(rand({ x: ip.x, y: ip.y + 1.0 }), rand({ x: ip.x + 1.0, y: ip.y + 1.0 }), u.x),
        u.y
    );
    return res * res;
}

const mtx = [[0.80, 0.60], [-0.60, 0.80]];
const u_random = Math.random();

function fbm(p, time) {
    let f = 0.0;

    f += 0.500000 * noise(p);
    p = mtx_mult(mtx, p); p.x *= 2.02; p.y *= 2.02;

    f += 0.031250 * noise({ x: p.x + time, y: p.y + time });
    p = mtx_mult(mtx, p); p.x *= 2.01; p.y *= 2.01;

    f += 0.250000 * noise({ x: p.x + time, y: p.y + time });
    p = mtx_mult(mtx, p); p.x *= (1.03 + u_random); p.y *= (1.03 + u_random);

    f += 0.125000 * noise(p);
    p = mtx_mult(mtx, p); p.x *= 2.01; p.y *= 2.01;

    f += 0.062500 * noise({ x: p.x + time, y: p.y + time });
    p = mtx_mult(mtx, p); p.x *= 2.04; p.y *= 2.04;

    f += 0.015625 * noise({ x: p.x + Math.sin(time), y: p.y + Math.sin(time) });

    return f / 0.96875;
}

function pattern(p, time) {
    const p1 = fbm(p, time);
    const p2 = fbm({ x: p.x + p1, y: p.y + p1 }, time);
    const p3 = fbm({ x: p.x + p2, y: p.y + p2 }, time);
    return fbm({ x: p.x + p3, y: p.y + p3 }, time);
}

// --- Main Application ---
let time = 0;

function renderFrame() {
    let frameBuffer = '';
    const aspectRatio = WIDTH / HEIGHT;
    const colors = gradient.rgb(WIDTH * HEIGHT);

    for (let j = 0; j < HEIGHT; j++) {
        for (let i = 0; i < WIDTH; i++) {
            const vUv = {
                x: i / WIDTH,
                y: j / HEIGHT
            };

            let shade = pattern(vUv, time);
            shade = Math.max(0.0, Math.min(1.0, shade));

            const charIndex = Math.floor(shade * (ASCII_RAMP.length - 1));
            const char = ASCII_RAMP[charIndex];
            
            const color = gradient.rgbAt(shade);
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
    console.log("Starting ASCII chaos animation. Press Ctrl+C to exit.");
    console.log("Use --ascii '<chars>' to set a custom character ramp.");
    console.log("Use --colors '<color1>,<color2>,...' to set a custom gradient.");
    setInterval(() => {
        time += 0.02;
        renderFrame();
    }, 1000 / FRAME_RATE);
}

start();
