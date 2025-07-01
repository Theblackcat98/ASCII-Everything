// terminal-cubes.js
// Renders a 3D scene of rotating cubes as ASCII art in the terminal.

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

// --- 3D Engine ---

// --- 3D Math Library ---
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

const mat4 = {
    create: () => [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ],
    multiply: (a, b) => {
        const result = mat4.create();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] =
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        return result;
    },
    fromTranslation: (v) => [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        v.x, v.y, v.z, 1
    ],
    fromXRotation: (angle) => {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        ];
    },
    fromYRotation: (angle) => {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        ];
    },
    fromZRotation: (angle) => {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },
    transformPoint: (m, p) => {
        const w = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15];
        return {
            x: (m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12]) / w,
            y: (m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13]) / w,
            z: (m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14]) / w
        };
    }
};

// (Will be implemented in the next steps)

// --- 3D Engine Core ---
const camera = {
    position: vec3.create(0, 0, -5),
    target: vec3.create(0, 0, 0),
    up: vec3.create(0, 1, 0)
};

const cubeMesh = {
    vertices: [
        // Front face
        { pos: vec3.create(-1, -1, 1), normal: vec3.create(0, 0, 1) },
        { pos: vec3.create(1, -1, 1), normal: vec3.create(0, 0, 1) },
        { pos: vec3.create(1, 1, 1), normal: vec3.create(0, 0, 1) },
        { pos: vec3.create(-1, 1, 1), normal: vec3.create(0, 0, 1) },
        // Back face
        { pos: vec3.create(-1, -1, -1), normal: vec3.create(0, 0, -1) },
        { pos: vec3.create(-1, 1, -1), normal: vec3.create(0, 0, -1) },
        { pos: vec3.create(1, 1, -1), normal: vec3.create(0, 0, -1) },
        { pos: vec3.create(1, -1, -1), normal: vec3.create(0, 0, -1) },
    ],
    indices: [
        0, 1, 2, 0, 2, 3, // Front
        4, 5, 6, 4, 6, 7, // Back
        3, 2, 6, 3, 6, 5, // Top
        0, 1, 7, 0, 7, 4, // Bottom
        1, 7, 6, 1, 6, 2, // Right
        0, 4, 5, 0, 5, 3  // Left
    ]
};

function createViewMatrix(camera) {
    const zAxis = vec3.normalize(vec3.subtract(camera.position, camera.target));
    const xAxis = vec3.normalize(vec3.cross(camera.up, zAxis));
    const yAxis = vec3.cross(zAxis, xAxis);

    return [
        xAxis.x, yAxis.x, zAxis.x, 0,
        xAxis.y, yAxis.y, zAxis.y, 0,
        xAxis.z, yAxis.z, zAxis.z, 0,
        -vec3.dot(xAxis, camera.position), -vec3.dot(yAxis, camera.position), -vec3.dot(zAxis, camera.position), 1
    ];
}

function createProjectionMatrix(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const rangeInv = 1 / (near - far);

    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];
}

const fogGradient = tinygradient(gradientColors);

function drawPixel(x, y, z, char, color, frameBuffer, zBuffer) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;

    const index = y * WIDTH + x;
    if (z < zBuffer[index]) {
        zBuffer[index] = z;
        const c = color.toRgb();
        frameBuffer[index] = `\x1b[38;2;${Math.round(c.r)};${Math.round(c.g)};${Math.round(c.b)}m${char}`;
    }
}

function drawLine(p1, p2, char, color, frameBuffer, zBuffer) {
    let x0 = Math.round(p1.x);
    let y0 = Math.round(p1.y);
    const x1 = Math.round(p2.x);
    const y1 = Math.round(p2.y);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        const t = Math.sqrt(Math.pow(x0 - p1.x, 2) + Math.pow(y0 - p1.y, 2)) / Math.sqrt(Math.pow(x1 - p1.x, 2) + Math.pow(y1 - p1.y, 2));
        const z = p1.z + (p2.z - p1.z) * t;
        drawPixel(x0, y0, z, char, color, frameBuffer, zBuffer);

        if ((x0 === x1) && (y0 === y1)) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
}


// --- Main Application ---

const cubes = [];
const numCubes = 20;
let time = 0;

function setupScene() {
    for (let i = 0; i < numCubes; i++) {
        cubes.push({
            position: vec3.create(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            ),
            rotation: vec3.create(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            ),
            scale: vec3.create(1, 1, 1)
        });
    }
}

function renderFrame() {
    // Initialize buffers
    const frameBuffer = Array(WIDTH * HEIGHT).fill(' ');
    const zBuffer = Array(WIDTH * HEIGHT).fill(Infinity);

    time += 0.01;

    const viewMatrix = createViewMatrix(camera);
    const projectionMatrix = createProjectionMatrix(Math.PI / 2, WIDTH / HEIGHT, 0.1, 100);
    const lightDir = vec3.normalize(vec3.create(1, 1, -1));

    for (const cube of cubes) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        const worldMatrix = mat4.multiply(
            mat4.fromXRotation(cube.rotation.x),
            mat4.fromYRotation(cube.rotation.y)
        );
        const transform = mat4.multiply(projectionMatrix, mat4.multiply(viewMatrix, worldMatrix));

        const transformedVertices = cubeMesh.vertices.map(v => {
            const tv = mat4.transformPoint(transform, v.pos);
            tv.x = (tv.x * 0.5 + 0.5) * WIDTH;
            tv.y = (-tv.y * 0.5 + 0.5) * HEIGHT;
            return tv;
        });

        for (let i = 0; i < cubeMesh.indices.length; i += 3) {
            const v1 = cubeMesh.vertices[cubeMesh.indices[i]];
            const v2 = cubeMesh.vertices[cubeMesh.indices[i+1]];
            const v3 = cubeMesh.vertices[cubeMesh.indices[i+2]];

            const normal = vec3.normalize(vec3.cross(vec3.subtract(v2.pos, v1.pos), vec3.subtract(v3.pos, v1.pos)));
            const intensity = vec3.dot(normal, lightDir);

            if (intensity > 0) {
                const tv1 = transformedVertices[cubeMesh.indices[i]];
                const tv2 = transformedVertices[cubeMesh.indices[i + 1]];
                const tv3 = transformedVertices[cubeMesh.indices[i + 2]];

                const char = ASCII_RAMP[Math.floor(intensity * (ASCII_RAMP.length - 1))];
                
                 const color = gradient.rgbAt(intensity);
                drawLine(tv1, tv2, char, color, frameBuffer, zBuffer);
                drawLine(tv2, tv3, char, color, frameBuffer, zBuffer);
                drawLine(tv3, tv1, char, color, frameBuffer, zBuffer);
            }
        }
    }

    // Convert buffers to string for printing
    let output = '';
    for (let j = 0; j < HEIGHT; j++) {
        for (let i = 0; i < WIDTH; i++) {
            output += frameBuffer[j * WIDTH + i];
        }
        if (j < HEIGHT - 1) {
            output += '\n';
        }
    }

    process.stdout.write('\x1Bc');
    process.stdout.write(output);
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
    console.log("Starting 3D ASCII cube animation. This is a heavy task, performance may vary.");
    console.log("Press Ctrl+C to exit.");

    setupScene();
    setInterval(() => {
        renderFrame();
    }, 1000 / FRAME_RATE);
}


start();
