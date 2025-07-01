// terminal-ambient-light.js
// Adapted from AmbientLightBg.js to render ASCII art in the terminal.

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
const Grad = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

const p = new Uint8Array(256);
for (let i = 0; i < 256; i++) p[i] = i;

let perm = new Uint8Array(512);
let permMod12 = new Uint8Array(512);

(function (p) {
  for (let i = 0; i < 256; i++) {
    const j = Math.floor(Math.random() * (256 - i)) + i;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }
})(p);

function snoise(x, y, z) {
  const F3 = 1 / 3;
  const G3 = 1 / 6;

  let s = (x + y + z) * F3;
  let i = Math.floor(x + s);
  let j = Math.floor(y + s);
  let k = Math.floor(z + s);
  let t = (i + j + k) * G3;

  let x0 = x - (i - t);
  let y0 = y - (j - t);
  let z0 = z - (k - t);

  let i1, j1, k1;
  let i2, j2, k2;

  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1;
      j1 = 0;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1;
      j1 = 0;
      k1 = 0;
      i2 = 1;
      j2 = 0;
      k2 = 1;
    } else {
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 1;
      j2 = 0;
      k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else if (x0 < z0) {
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else {
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    }
  }

  let x1 = x0 - i1 + G3;
  let y1 = y0 - j1 + G3;
  let z1 = z0 - k1 + G3;
  let x2 = x0 - i2 + 2 * G3;
  let y2 = y0 - j2 + 2 * G3;
  let z2 = z0 - k2 + 2 * G3;
  let x3 = x0 - 1 + 3 * G3;
  let y3 = y0 - 1 + 3 * G3;
  let z3 = z0 - 1 + 3 * G3;

  let ii = i & 255;
  let jj = j & 255;
  let kk = k & 255;

  let gi0 = permMod12[ii + perm[jj + perm[kk]]];
  let gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
  let gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
  let gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];

  let t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0;
  let n0;
  if (t0 < 0) n0 = 0;
  else {
    t0 *= t0;
    n0 = t0 * t0 * (Grad[gi0][0] * x0 + Grad[gi0][1] * y0 + Grad[gi0][2] * z0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1;
  let n1;
  if (t1 < 0) n1 = 0;
  else {
    t1 *= t1;
    n1 = t1 * t1 * (Grad[gi1][0] * x1 + Grad[gi1][1] * y1 + Grad[gi1][2] * z1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2;
  let n2;
  if (t2 < 0) n2 = 0;
  else {
    t2 *= t2;
    n2 = t2 * t2 * (Grad[gi2][0] * x2 + Grad[gi2][1] * y2 + Grad[gi2][2] * z2);
  }

  let t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3;
  let n3;
  if (t3 < 0) n3 = 0;
  else {
    t3 *= t3;
    n3 = t3 * t3 * (Grad[gi3][0] * x3 + Grad[gi3][1] * y3 + Grad[gi3][2] * z3);
  }

  return 32 * (n0 + n1 + n2 + n3);
}

const vec3 = {
    create: (x = 0, y = 0, z = 0) => ({ x, y, z }),
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
    subtract: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
    scale: (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s }),
    dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
    cross: (a, b) => ({
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    }),
    normalize: (a) => {
        const len = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
        if (len > 0) {
            return { x: a.x / len, y: a.y / len, z: a.z / len };
        }
        return a;
    }
};

function snoise3(v) {
    return snoise(v.x, v.y, v.z);
}

function curl(p) {
    const e = 0.1;
    const dx = { x: e, y: 0, z: 0 };
    const dy = { x: 0, y: e, z: 0 };
    const dz = { x: 0, y: 0, z: e };

    const p_x0 = snoise3(vec3.subtract(p, dx));
    const p_x1 = snoise3(vec3.add(p, dx));
    const p_y0 = snoise3(vec3.subtract(p, dy));
    const p_y1 = snoise3(vec3.add(p, dy));
    const p_z0 = snoise3(vec3.subtract(p, dz));
    const p_z1 = snoise3(vec3.add(p, dz));

    const x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    const y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    const z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

    const divisor = 1.0 / (2.0 * e);
    return vec3.normalize({ x, y, z });
}

// --- Main Application ---
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

            const d3 = curl({ x: st.x * 1.0, y: st.y * 1.0, z: time });
            const shade = (d3.x + d3.y + d3.z) / 3.0;

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
    console.log("Starting ASCII animation. Press Ctrl+C to exit.");
    console.log("Use --ascii '<chars>' to set a custom character ramp.");
    console.log("Use --colors '<color1>,<color2>,...' to set a custom gradient.");
    setInterval(() => {
        time += 0.02;
        renderFrame();
    }, 1000 / FRAME_RATE);
}

start();
