// terminal-aesthetic-fluid.js
// Adapted from AestheticFluidBg.js to render ASCII art in the terminal.

import tinygradient from 'tinygradient';

// --- Argument Parsing ---
const args = process.argv.slice(2);
let customAsciiRamp = ' .:-=+*#%@';
let gradientColors = ['#ff0000', '#00ff00', '#0000ff'];

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
const FRAME_RATE = 30;

const ASCII_RAMP = customAsciiRamp;
const gradient = tinygradient(gradientColors);

// --- Ported Shader Logic ---
const u_dyes = [];
for (let i = 0; i < 6; i++) {
    u_dyes.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random() * 0.1 + 0.1,
        w: Math.random() * 0.3 + 0.3
    });
}

function blurDot(st, pos, inner, outer) {
    const pct = Math.sqrt(Math.pow(st.x - pos.x, 2) + Math.pow(st.y - pos.y, 2));
    const alpha = 1.0 - ((pct - inner) / (outer - inner));
    return Math.max(0.0, Math.min(1.0, alpha));
}

let time = 0;

function renderFrame() {
    let frameBuffer = '';
    const aspectRatio = WIDTH / HEIGHT;

    for (let j = 0; j < HEIGHT; j++) {
        for (let i = 0; i < WIDTH; i++) {
            const st = {
                x: i / WIDTH,
                y: j / HEIGHT
            };

            let shade = 0.0;
            for (let k = 0; k < 6; k++) {
                const dye = u_dyes[k];
                shade += blurDot(st, {x: dye.x, y: dye.y}, dye.z, dye.w);
            }
            
            const wavyX = st.x + Math.sin(time + st.y * 15.0) * 0.15;
            const wavyY = st.y + Math.cos(time + st.x * 15.0) * 0.15;
            
            let finalShade = 0.0;
            for (let k = 0; k < 6; k++) {
                const dye = u_dyes[k];
                finalShade += blurDot({x: wavyX, y: wavyY}, {x: dye.x, y: dye.y}, dye.z, dye.w);
            }

            finalShade = Math.max(0.0, Math.min(1.0, finalShade));

            const charIndex = Math.floor(finalShade * (ASCII_RAMP.length - 1));
            const char = ASCII_RAMP[charIndex];
            
            const color = gradient.rgbAt(finalShade);
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
    console.log("Starting ASCII animation. Press Ctrl+C to exit.");
    console.log("Use --ascii '<chars>' to set a custom character ramp.");
    console.log("Use --colors '<color1>,<color2>,...' to set a custom gradient.");
    setInterval(() => {
        time += 0.02;
        renderFrame();
    }, 1000 / FRAME_RATE);
}

start();
