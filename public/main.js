import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================================
// 1. GESTOR DE AUDIO PROCEDURAL (WEB AUDIO API)
// ==========================================================
class SoundFXManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.ambientGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.startAmbient();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.ambientGain) {
            this.ambientGain.gain.setValueAtTime(this.enabled ? 0.04 : 0, this.ctx ? this.ctx.currentTime : 0);
        }
        return this.enabled;
    }

    startAmbient() {
        if (!this.ctx) return;
        // Ruido blanco suave filtrado como murmullo submarino
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, this.ctx.currentTime);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.enabled ? 0.04 : 0, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);
        whiteNoise.start();
    }

    playBubblePop() {
        if (!this.ctx || !this.enabled) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const freq = 450 + Math.random() * 350;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    playChime() {
        if (!this.ctx || !this.enabled) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.06;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(start);
            osc.stop(start + 0.4);
        });
    }

    playSplash() {
        if (!this.ctx || !this.enabled) return;
        this.playBubblePop();
        setTimeout(() => this.playBubblePop(), 40);
        setTimeout(() => this.playBubblePop(), 90);
    }
}

const soundFX = new SoundFXManager();

// ==========================================================
// 2. CONFIGURACIÓN DEL ESCENARIO 3D (THREE.JS)
// ==========================================================
const canvas = document.getElementById('aquarium-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x13041a);
scene.fog = new THREE.FogExp2(0x190524, 0.018);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 30);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 50;
controls.minDistance = 8;
controls.maxPolarAngle = Math.PI / 2 + 0.1;
controls.target.set(0, 0, 0);

// Dimensiones de la pecera
const TANK = {
    w: 28,  // -14 a 14
    h: 13,  // -6.5 a 6.5
    d: 19   // -9.5 a 9.5
};

// ==========================================================
// 3. ILUMINACIÓN AMBIENTAL Y REFLEJOS SUBMARINOS SATURNO
// ==========================================================
const ambientLight = new THREE.AmbientLight(0x4a1038, 1.8);
scene.add(ambientLight);

// Luz del sol atravesando el agua con reflejos rosa/magenta
const sunLight = new THREE.DirectionalLight(0xf472b6, 2.5);
sunLight.position.set(5, 20, 8);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 5;
sunLight.shadow.camera.far = 40;
sunLight.shadow.camera.left = -16;
sunLight.shadow.camera.right = 16;
sunLight.shadow.camera.top = 16;
sunLight.shadow.camera.bottom = -16;
scene.add(sunLight);

// Luces bioluminiscentes rosa neón
const bluePointLight = new THREE.PointLight(0xff2a8d, 2.4, 25);
bluePointLight.position.set(-8, -4, 2);
scene.add(bluePointLight);

const pinkPointLight = new THREE.PointLight(0xf43f5e, 2.2, 25);
pinkPointLight.position.set(8, -4, 2);
scene.add(pinkPointLight);

let isNightMode = false;
function toggleLighting() {
    isNightMode = !isNightMode;
    const lightText = document.getElementById('lighting-text');
    if (isNightMode) {
        scene.background.set(0x0a010f);
        scene.fog.color.set(0x0e0214);
        ambientLight.intensity = 0.8;
        sunLight.intensity = 0.7;
        sunLight.color.set(0xff70ba);
        bluePointLight.intensity = 3.8;
        pinkPointLight.intensity = 3.5;
        if (lightText) lightText.textContent = 'Modo Día';
        showToast('🌙 Modo Saturno Noche activado', '#ff2a8d');
    } else {
        scene.background.set(0x13041a);
        scene.fog.color.set(0x190524);
        ambientLight.intensity = 1.8;
        sunLight.intensity = 2.5;
        sunLight.color.set(0xf472b6);
        bluePointLight.intensity = 2.4;
        pinkPointLight.intensity = 2.2;
        if (lightText) lightText.textContent = 'Modo Noche';
        showToast('🪐 Modo Saturno Rosa activado', '#f43f5e');
    }
}

// ==========================================================
// 4. ESTRUCTURA 3D DE LA PECERA GIGANTE (CRISTAL Y PILARES)
// ==========================================================
function buildAquariumStructure() {
    const tankGroup = new THREE.Group();

    // Material de Cristal Refractario con tinte rosa translúcido
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf472b6,
        transparent: true,
        opacity: 0.22,
        roughness: 0.05,
        transmission: 0.85,
        ior: 1.333,
        thickness: 0.8,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffffff),
        side: THREE.DoubleSide
    });

    // Marco Metálico Reforzado
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.25
    });

    // Paredes de cristal (Frente, Atrás, Izquierda, Derecha)
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(TANK.w, TANK.h), glassMaterial);
    frontWall.position.set(0, 0, TANK.d / 2);
    tankGroup.add(frontWall);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(TANK.w, TANK.h), glassMaterial);
    backWall.position.set(0, 0, -TANK.d / 2);
    backWall.rotation.y = Math.PI;
    tankGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(TANK.d, TANK.h), glassMaterial);
    leftWall.position.set(-TANK.w / 2, 0, 0);
    leftWall.rotation.y = Math.PI / 2;
    tankGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(TANK.d, TANK.h), glassMaterial);
    rightWall.position.set(TANK.w / 2, 0, 0);
    rightWall.rotation.y = -Math.PI / 2;
    tankGroup.add(rightWall);

    // Superficie superior del agua con ondas rosa/magenta
    const waterGeo = new THREE.PlaneGeometry(TANK.w, TANK.d, 32, 32);
    const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0xff2a8d,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        transmission: 0.6,
        side: THREE.DoubleSide
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = TANK.h / 2;
    tankGroup.add(waterMesh);
    waterMesh.name = "WaterSurface";

    // Suelo de la pecera (Base metálica inferior)
    const baseGeo = new THREE.BoxGeometry(TANK.w + 1.2, 0.8, TANK.d + 1.2);
    const baseMesh = new THREE.Mesh(baseGeo, frameMaterial);
    baseMesh.position.y = -TANK.h / 2 - 0.4;
    tankGroup.add(baseMesh);

    // Borde superior
    const rimGeo = new THREE.BoxGeometry(TANK.w + 0.8, 0.5, TANK.d + 0.8);
    const rimMesh = new THREE.Mesh(rimGeo, frameMaterial);
    rimMesh.position.y = TANK.h / 2 + 0.25;
    tankGroup.add(rimMesh);

    // 4 Pilares de las esquinas
    const pillarGeo = new THREE.BoxGeometry(0.8, TANK.h + 0.8, 0.8);
    const corners = [
        [-TANK.w / 2, 0, -TANK.d / 2],
        [TANK.w / 2, 0, -TANK.d / 2],
        [-TANK.w / 2, 0, TANK.d / 2],
        [TANK.w / 2, 0, TANK.d / 2]
    ];
    corners.forEach(([x, y, z]) => {
        const pillar = new THREE.Mesh(pillarGeo, frameMaterial);
        pillar.position.set(x, y, z);
        tankGroup.add(pillar);
    });

    scene.add(tankGroup);
}

buildAquariumStructure();

// ==========================================================
// 5. SISTEMAS DE PARTÍCULAS (BURBUJAS, PLANCTON Y COMIDA)
// ==========================================================

// Burbujas ascendentes
const BUBBLE_COUNT = 220;
const bubbleGeo = new THREE.SphereGeometry(0.08, 8, 8);
const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    transmission: 0.9
});

const bubbleInstanced = new THREE.InstancedMesh(bubbleGeo, bubbleMat, BUBBLE_COUNT);
const bubbleData = [];
const dummyMatrix = new THREE.Matrix4();

for (let i = 0; i < BUBBLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * (TANK.w - 3);
    const y = -TANK.h / 2 + Math.random() * TANK.h;
    const z = (Math.random() - 0.5) * (TANK.d - 3);
    const speed = 0.03 + Math.random() * 0.05;
    const wobbleSpeed = 1.5 + Math.random() * 2.0;
    const scale = 0.6 + Math.random() * 1.4;

    bubbleData.push({ x, y, z, startX: x, speed, wobbleSpeed, scale, phase: Math.random() * Math.PI * 2 });

    dummyMatrix.makeTranslation(x, y, z);
    dummyMatrix.scale(new THREE.Vector3(scale, scale, scale));
    bubbleInstanced.setMatrixAt(i, dummyMatrix);
}
scene.add(bubbleInstanced);

// Plancton / Polvo Marino
const PLANKTON_COUNT = 600;
const planktonGeo = new THREE.BufferGeometry();
const planktonPositions = new Float32Array(PLANKTON_COUNT * 3);
for (let i = 0; i < PLANKTON_COUNT * 3; i += 3) {
    planktonPositions[i] = (Math.random() - 0.5) * (TANK.w - 1);
    planktonPositions[i + 1] = (Math.random() - 0.5) * (TANK.h - 1);
    planktonPositions[i + 2] = (Math.random() - 0.5) * (TANK.d - 1);
}
planktonGeo.setAttribute('position', new THREE.BufferAttribute(planktonPositions, 3));
const planktonMat = new THREE.PointsMaterial({
    color: 0xff70ba,
    size: 0.13,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const planktonParticles = new THREE.Points(planktonGeo, planktonMat);
scene.add(planktonParticles);

// Partículas de efectos de interacción (estallido de caricia)
const burstParticles = [];
function createBurstParticles(x, y, z, colorHex = '#ff2a8d') {
    const count = 35;
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.9
    });
    const geo = new THREE.SphereGeometry(0.12, 6, 6);

    const items = [];
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geo, mat.clone());
        mesh.position.set(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.08 + Math.random() * 0.14;
        const vx = Math.sin(phi) * Math.cos(theta) * speed;
        const vy = Math.cos(phi) * speed;
        const vz = Math.sin(phi) * Math.sin(theta) * speed;
        group.add(mesh);
        items.push({ mesh, vx, vy, vz, life: 1.0 });
    }
    scene.add(group);
    burstParticles.push({ group, items });
}

// Comida para peces
const foodPellets = [];
function spawnFoodPellet(pellet) {
    const geo = new THREE.DodecahedronGeometry(0.16);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.6,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pellet.x, pellet.y, pellet.z);
    mesh.castShadow = true;
    scene.add(mesh);
    foodPellets.push({ id: pellet.id, mesh, speed: pellet.fallSpeed * 0.03 });
}

// ==========================================================
// 6. CARGA DE MODELOS 3D DE BLENDER (GLTF/GLB)
// ==========================================================
const gltfLoader = new GLTFLoader();
const modelCache = new Map();

const MODEL_PATHS = {
    'clownfish': 'models/clownfish.glb',
    'angelfish': 'models/angelfish.glb',
    'bluetang': 'models/bluetang.glb',
    'pufferfish': 'models/pufferfish.glb',
    'goldfish': 'models/goldfish.glb',
    'decor': 'models/aquarium_decor.glb'
};

// Cargar decoraciones del fondo marino
gltfLoader.load(MODEL_PATHS.decor, (gltf) => {
    const decor = gltf.scene;
    decor.position.set(0, 0, 0);
    decor.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(decor);
    console.log("Decoración marina de Blender cargada con éxito!");
}, undefined, (err) => console.error("Error cargando decoración:", err));

// Pre-cargar todas las especies de peces
Object.entries(MODEL_PATHS).forEach(([key, path]) => {
    if (key === 'decor') return;
    gltfLoader.load(path, (gltf) => {
        modelCache.set(key, gltf.scene);
        console.log(`Modelo Blender cargado: ${key}`);
    }, undefined, (err) => console.error(`Error cargando ${key}:`, err));
});

// ==========================================================
// 7. GESTOR DE PECES Y SIMULACIÓN DE NADO
// ==========================================================
const fishObjects = new Map(); // fishId -> { container, model, data, animState, animClock }

function createFallbackFishMesh(type, colorHex) {
    // Si el modelo GLB aún no ha terminado de descargarse, se usa un pez estilizado temporal
    const group = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(0.7, 16, 12);
    bodyGeo.scale(0.5, 0.8, 1.3);
    const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex), roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const tailGeo = new THREE.ConeGeometry(0.4, 0.7, 8);
    tailGeo.rotateX(Math.PI / 2);
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.z = -1.2;
    group.add(tail);

    return group;
}

function instantiateFish(data) {
    const container = new THREE.Group();
    container.position.set(data.x, data.y, data.z);

    const baseModel = modelCache.get(data.type);
    let modelInstance;

    if (baseModel) {
        modelInstance = baseModel.clone(true);
        // Aplicar tinte al material principal si es personalizado
        if (data.color) {
            const tintColor = new THREE.Color(data.color);
            modelInstance.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(m => m.clone());
                    } else {
                        child.material = child.material.clone();
                    }
                    if (child.name.includes('Body') || child.name.includes('Clown') || child.name.includes('Gold')) {
                        child.material.color = tintColor;
                    }
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
    } else {
        modelInstance = createFallbackFishMesh(data.type, data.color);
    }

    const scale = (data.size || 1.0) * 0.9;
    modelInstance.scale.set(scale, scale, scale);
    container.add(modelInstance);

    // Objeto contenedor con metadatos para raycasting
    container.userData = {
        id: data.id,
        name: data.name,
        type: data.type,
        ownerName: data.ownerName
    };

    scene.add(container);

    const fishEntry = {
        container,
        model: modelInstance,
        data: { ...data },
        animState: 'swimming', // 'swimming' | 'somersault' | 'spin_dash' | 'barrel_roll' | 'balloon_bounce'
        animProgress: 0,
        swimPhase: Math.random() * Math.PI * 2,
        baseScale: scale
    };

    fishObjects.set(data.id, fishEntry);
    updateFishCountHUD();
    return fishEntry;
}

// Disparar animación interactiva sincronizada en un pez
function triggerFishAnimation(fishId, animType, userName, userColor) {
    const fish = fishObjects.get(fishId);
    if (!fish) return;

    fish.animState = animType;
    fish.animProgress = 0;

    // Efecto de partículas 3D en la posición del pez
    createBurstParticles(fish.container.position.x, fish.container.position.y, fish.container.position.z, userColor);

    // Sonido
    soundFX.playSplash();

    // Notificación Toast
    const animNames = {
        'somersault': '¡dio una voltereta vertical!',
        'spin_dash': '¡hizo un giro a toda velocidad!',
        'barrel_roll': '¡hizo un giro helicoidal!',
        'bubble_frenzy': '¡nadó en zigzag emocionado!',
        'balloon_bounce': '¡se infló de sorpresa y rebotó!'
    };
    const desc = animNames[animType] || '¡hizo un truco!';
    showToast(`✨ <strong>${userName}</strong> acarició a <strong>${fish.data.name}</strong> (${desc})`, userColor);

    incrementInteractionsHUD();
}

// ==========================================================
// 8. COMUNICACIÓN EN TIEMPO REAL CON SOCKET.IO
// ==========================================================
const socket = io();
let selfUser = null;
const remoteUsers = new Map(); // socket.id -> { element, data, targetX, targetY, currX, currY }

// Elementos del DOM
const cursorsOverlay = document.getElementById('cursors-overlay');
const onlineCountElem = document.getElementById('online-count');
const avatarsListElem = document.getElementById('users-avatars-list');
const selfUsernameElem = document.getElementById('self-username');
const selfColorDotElem = document.getElementById('self-color-dot');
const fishCountElem = document.getElementById('fish-count');
const interactionsCountElem = document.getElementById('interactions-count');
let interactionsTotal = 0;

function updateFishCountHUD() {
    if (fishCountElem) {
        fishCountElem.textContent = fishObjects.size;
    }
}

function incrementInteractionsHUD() {
    interactionsTotal++;
    if (interactionsCountElem) {
        interactionsCountElem.textContent = interactionsTotal;
    }
}

function updateUsersListHUD(users) {
    if (onlineCountElem) {
        onlineCountElem.textContent = `${users.length} Conectado${users.length > 1 ? 's' : ''}`;
    }
    if (avatarsListElem) {
        avatarsListElem.innerHTML = '';
        users.forEach(u => {
            const pill = document.createElement('div');
            pill.className = 'user-mini-pill';
            pill.style.backgroundColor = u.color;
            pill.title = u.name;
            pill.textContent = u.name.charAt(0).toUpperCase();
            avatarsListElem.appendChild(pill);
        });
    }
}

function showToast(htmlMessage, accentColor = '#ff2a8d') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = accentColor;
    toast.innerHTML = htmlMessage;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
}

// Estado Inicial recibido del servidor
socket.on('init_state', (data) => {
    selfUser = data.self;
    if (selfUsernameElem) selfUsernameElem.textContent = selfUser.name;
    if (selfColorDotElem) {
        selfColorDotElem.style.backgroundColor = selfUser.color;
        selfColorDotElem.style.boxShadow = `0 0 8px ${selfUser.color}`;
    }

    updateUsersListHUD(data.users);

    // Instanciar peces existentes
    data.fishes.forEach(fishData => {
        instantiateFish(fishData);
    });

    showToast(`🪐 ¡Bienvenido/a a SATURNO 3D, <strong>${selfUser.name}</strong>!`, selfUser.color);
});

// Nuevo usuario conectado
socket.on('user_joined', (user) => {
    showToast(`👋 <strong>${user.name}</strong> entró al acuario`, user.color);
    soundFX.playBubblePop();
});

// Pez añadido por cualquier usuario
socket.on('fish_added', (newFish) => {
    instantiateFish(newFish);
    soundFX.playChime();
    showToast(`🐠 <strong>${newFish.ownerName}</strong> liberó a <strong>${newFish.name}</strong> (${newFish.type})`, newFish.color);
});

// Interacción con pez por cualquier usuario
socket.on('fish_interacted', (data) => {
    triggerFishAnimation(data.fishId, data.animType, data.userName, data.userColor);
});

// Comida tirada
socket.on('food_dropped', (data) => {
    soundFX.playBubblePop();
    data.pellets.forEach(pellet => spawnFoodPellet(pellet));
    showToast(`🦐 <strong>${data.byUser}</strong> tiró comida para los peces`, data.userColor);
});

// Sincronización periódica de trayectorias
socket.on('fishes_heartbeat', (updates) => {
    updates.forEach(u => {
        const fish = fishObjects.get(u.id);
        if (fish) {
            fish.data.targetX = u.targetX;
            fish.data.targetY = u.targetY;
            fish.data.targetZ = u.targetZ;
            fish.data.speed = u.speed;
        }
    });
});

// ==========================================================
// 9. SISTEMA DE PUNTEROS MULTIUSUARIO EN VIVO
// ==========================================================
function getOrCreateRemoteCursor(id, name, color) {
    if (remoteUsers.has(id)) {
        return remoteUsers.get(id);
    }

    const cursorContainer = document.createElement('div');
    cursorContainer.className = 'remote-cursor';
    cursorContainer.id = `cursor-${id}`;

    cursorContainer.innerHTML = `
        <svg class="cursor-pointer-icon" viewBox="0 0 24 24" fill="${color}" stroke="#030814" stroke-width="1.5">
            <path d="M4 2l16 10-7.5 1.5L9 21z" />
        </svg>
        <span class="cursor-tag" style="color: ${color}; border-color: ${color};">
            ${name}
        </span>
    `;

    cursorsOverlay.appendChild(cursorContainer);

    const userObj = {
        element: cursorContainer,
        name,
        color,
        currX: window.innerWidth / 2,
        currY: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2
    };

    remoteUsers.set(id, userObj);
    return userObj;
}

// Movimiento del cursor de otros clientes
socket.on('cursor_moved', (data) => {
    const user = getOrCreateRemoteCursor(data.id, data.name, data.color);
    user.targetX = data.nx * window.innerWidth;
    user.targetY = data.ny * window.innerHeight;
});

// Click del cursor de cualquier cliente (muestra onda de agua)
socket.on('cursor_clicked', (data) => {
    const ripple = document.createElement('div');
    ripple.className = 'cursor-ripple';
    ripple.style.left = `${data.nx * window.innerWidth}px`;
    ripple.style.top = `${data.ny * window.innerHeight}px`;
    ripple.style.borderColor = data.color;
    ripple.style.boxShadow = `0 0 12px ${data.color}`;
    cursorsOverlay.appendChild(ripple);
    soundFX.playBubblePop();
    setTimeout(() => {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 900);
});

// Desconexión de usuario
socket.on('user_left', (data) => {
    if (remoteUsers.has(data.id)) {
        const u = remoteUsers.get(data.id);
        if (u.element && u.element.parentNode) {
            u.element.parentNode.removeChild(u.element);
        }
        remoteUsers.delete(data.id);
    }
});

// Enviar posición del mouse local (con throttling para no saturar la red)
let lastMouseEmit = 0;
window.addEventListener('mousemove', (e) => {
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;

    const now = performance.now();
    if (now - lastMouseEmit > 30) { // ~33 fps
        lastMouseEmit = now;
        socket.emit('cursor_move', {
            x: e.clientX,
            y: e.clientY,
            nx,
            ny
        });
    }
});

// ==========================================================
// 10. RAYCASTING: INTERACCIÓN AL TOCAR LOS PECES
// ==========================================================
const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();

canvas.addEventListener('pointerdown', (e) => {
    // Iniciar contexto de audio si es la primera interacción del usuario
    soundFX.init();

    mouseVec.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Notificar click para la onda visual compartida
    socket.emit('cursor_click', {
        x: e.clientX,
        y: e.clientY,
        nx: e.clientX / window.innerWidth,
        ny: e.clientY / window.innerHeight
    });

    raycaster.setFromCamera(mouseVec, camera);

    // Recolectar todos los grupos de peces
    const fishContainers = Array.from(fishObjects.values()).map(f => f.container);
    const intersects = raycaster.intersectObjects(fishContainers, true);

    if (intersects.length > 0) {
        // Encontrar el contenedor raíz del pez
        let hitObj = intersects[0].object;
        while (hitObj.parent && !hitObj.userData.id && hitObj.parent !== scene) {
            hitObj = hitObj.parent;
        }

        const fishId = hitObj.userData.id;
        if (fishId) {
            console.log(`¡Pez tocado por el usuario! ID: ${fishId}`);
            socket.emit('interact_fish', { fishId });
        }
    }
});

// ==========================================================
// 11. BUCLE DE ANIMACIÓN Y RENDERIZADO PRINCIPAL
// ==========================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 1. Controles de Cámara
    controls.update();

    // 2. Ondulación de la superficie del agua
    const water = scene.getObjectByName('WaterSurface');
    if (water) {
        water.position.y = (TANK.h / 2) + Math.sin(elapsedTime * 2.5) * 0.08;
    }

    // 3. Actualizar Burbujas
    for (let i = 0; i < BUBBLE_COUNT; i++) {
        const b = bubbleData[i];
        b.y += b.speed;
        b.x = b.startX + Math.sin(elapsedTime * b.wobbleSpeed + b.phase) * 0.35;

        // Si llega a la superficie, renace en el fondo
        if (b.y > TANK.h / 2) {
            b.y = -TANK.h / 2 + 0.2;
            b.startX = (Math.random() - 0.5) * (TANK.w - 3);
            b.z = (Math.random() - 0.5) * (TANK.d - 3);
        }

        dummyMatrix.makeTranslation(b.x, b.y, b.z);
        dummyMatrix.scale(new THREE.Vector3(b.scale, b.scale, b.scale));
        bubbleInstanced.setMatrixAt(i, dummyMatrix);
    }
    bubbleInstanced.instanceMatrix.needsUpdate = true;

    // 4. Actualizar Plancton
    planktonParticles.rotation.y = elapsedTime * 0.02;

    // 5. Actualizar Partículas de Interacción
    for (let i = burstParticles.length - 1; i >= 0; i--) {
        const bp = burstParticles[i];
        let alive = false;
        bp.items.forEach(item => {
            if (item.life > 0) {
                alive = true;
                item.life -= delta * 1.5;
                item.mesh.position.x += item.vx;
                item.mesh.position.y += item.vy + 0.01; // flotación leve
                item.mesh.position.z += item.vz;
                item.mesh.scale.setScalar(Math.max(0.01, item.life));
                item.mesh.material.opacity = item.life;
            }
        });
        if (!alive) {
            scene.remove(bp.group);
            burstParticles.splice(i, 1);
        }
    }

    // 6. Actualizar Comida para Peces
    for (let i = foodPellets.length - 1; i >= 0; i--) {
        const fp = foodPellets[i];
        fp.mesh.position.y -= fp.speed;
        fp.mesh.rotation.x += 0.03;
        fp.mesh.rotation.y += 0.02;

        // Si toca el fondo de arena, se disuelve
        if (fp.mesh.position.y <= -TANK.h / 2 + 0.4) {
            scene.remove(fp.mesh);
            foodPellets.splice(i, 1);
        }
    }

    // 7. Actualizar y Mover Cada Pez (Física de Nado y Animaciones)
    fishObjects.forEach((fish) => {
        const { container, model, data } = fish;
        const target = new THREE.Vector3(data.targetX, data.targetY, data.targetZ);
        const currPos = container.position;

        // Manejo de animaciones especiales
        if (fish.animState !== 'swimming') {
            fish.animProgress += delta * 1.6;

            if (fish.animState === 'somersault') {
                // Voltereta hacia atrás 360° en el eje X local
                const angle = Math.min(Math.PI * 2, fish.animProgress * Math.PI * 2);
                model.rotation.x = angle;
                container.position.y += Math.sin(angle) * 0.04;
            } else if (fish.animState === 'spin_dash') {
                // Giro de barril en el eje Z a toda velocidad
                model.rotation.z = fish.animProgress * Math.PI * 4;
                const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(container.quaternion);
                container.position.addScaledVector(forward, delta * 8 * data.speed);
            } else if (fish.animState === 'barrel_roll') {
                // Giro de barril elegante
                model.rotation.z = fish.animProgress * Math.PI * 2;
            } else if (fish.animState === 'balloon_bounce') {
                // Pez se infla y rebota
                const pulse = 1.0 + Math.sin(fish.animProgress * Math.PI) * 0.7;
                model.scale.setScalar(fish.baseScale * pulse);
            } else if (fish.animState === 'bubble_frenzy') {
                // Zigzag rápido
                model.rotation.y = Math.sin(fish.animProgress * 15) * 0.6;
                const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(container.quaternion);
                container.position.addScaledVector(forward, delta * 5 * data.speed);
            }

            if (fish.animProgress >= 1.0) {
                // Restaurar al terminar la animación
                fish.animState = 'swimming';
                model.rotation.set(0, 0, 0);
                model.scale.setScalar(fish.baseScale);
            }
        } else {
            // Nado Suave Estándar
            const dir = new THREE.Vector3().subVectors(target, currPos);
            const dist = dir.length();

            if (dist > 0.3) {
                dir.normalize();
                const step = Math.min(dist, delta * 2.2 * (data.speed || 1.0));
                currPos.addScaledVector(dir, step);

                // Orientar el pez suavemente hacia la dirección de movimiento
                const lookTarget = currPos.clone().add(dir);
                const targetRotation = new THREE.Matrix4().lookAt(lookTarget, currPos, new THREE.Vector3(0, 1, 0));
                const targetQuat = new THREE.Quaternion().setFromRotationMatrix(targetRotation);
                container.quaternion.slerp(targetQuat, delta * 3.5);
            }

            // Ondulación natural de la cola y cuerpo al nadar (seno temporal)
            const tailSway = Math.sin(elapsedTime * 6.0 * (data.speed || 1.0) + fish.swimPhase);
            model.rotation.y = tailSway * 0.18;
            model.rotation.z = Math.cos(elapsedTime * 3.0 + fish.swimPhase) * 0.05;
        }

        // Mantener dentro de los límites estrictos de la pecera
        currPos.x = THREE.MathUtils.clamp(currPos.x, -TANK.w / 2 + 1.2, TANK.w / 2 - 1.2);
        currPos.y = THREE.MathUtils.clamp(currPos.y, -TANK.h / 2 + 1.2, TANK.h / 2 - 1.2);
        currPos.z = THREE.MathUtils.clamp(currPos.z, -TANK.d / 2 + 1.2, TANK.d / 2 - 1.2);
    });

    // 8. Interpolar suavemente las posiciones de los punteros de los otros clientes
    remoteUsers.forEach(u => {
        u.currX += (u.targetX - u.currX) * 0.25;
        u.currY += (u.targetY - u.currY) * 0.25;
        u.element.style.transform = `translate3d(${u.currX}px, ${u.currY}px, 0)`;
    });

    // Renderizar la escena
    renderer.render(scene, camera);
}

animate();

// ==========================================================
// 12. EVENTOS DEL DOM Y CONTROLADORES DE INTERFAZ
// ==========================================================

// Redimensionar pantalla
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Botón de Audio
const btnSound = document.getElementById('btn-sound');
const soundIcon = document.getElementById('sound-icon');
if (btnSound) {
    btnSound.addEventListener('click', () => {
        soundFX.init();
        const active = soundFX.toggle();
        soundIcon.textContent = active ? '🔊' : '🔇';
    });
}

// Botón de Alimentar Peces
const btnFeed = document.getElementById('btn-feed');
if (btnFeed) {
    btnFeed.addEventListener('click', () => {
        soundFX.init();
        socket.emit('feed_tank', {
            x: (Math.random() - 0.5) * 6,
            z: (Math.random() - 0.5) * 6
        });
    });
}

// Botón de Iluminación
const btnLighting = document.getElementById('btn-lighting');
if (btnLighting) {
    btnLighting.addEventListener('click', toggleLighting);
}

// Modal de Agregar Pez
const spawnModal = document.getElementById('spawn-modal');
const btnOpenSpawn = document.getElementById('btn-open-spawn');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelSpawn = document.getElementById('btn-cancel-spawn');
const btnConfirmSpawn = document.getElementById('btn-confirm-spawn');

const fishNameInput = document.getElementById('fish-name-input');
const fishSizeSlider = document.getElementById('fish-size-slider');
const fishSpeedSlider = document.getElementById('fish-speed-slider');
const sizeVal = document.getElementById('size-val');
const speedVal = document.getElementById('speed-val');
const customColorPicker = document.getElementById('fish-custom-color');

let selectedType = 'clownfish';
let selectedColor = '#ff6600';

if (btnOpenSpawn && spawnModal) {
    btnOpenSpawn.addEventListener('click', () => {
        soundFX.init();
        spawnModal.classList.remove('hidden');
    });
}

function closeModal() {
    if (spawnModal) spawnModal.classList.add('hidden');
}

if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (btnCancelSpawn) btnCancelSpawn.addEventListener('click', closeModal);

// Selección de especie
document.querySelectorAll('.species-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.species-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedType = card.dataset.type;
        soundFX.playBubblePop();
    });
});

// Selección de color
document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        selectedColor = dot.dataset.color;
        if (customColorPicker) customColorPicker.value = selectedColor;
        soundFX.playBubblePop();
    });
});

if (customColorPicker) {
    customColorPicker.addEventListener('input', (e) => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        selectedColor = e.target.value;
    });
}

// Sliders interactivos
if (fishSizeSlider && sizeVal) {
    fishSizeSlider.addEventListener('input', (e) => {
        sizeVal.textContent = `${e.target.value}x`;
    });
}

if (fishSpeedSlider && speedVal) {
    fishSpeedSlider.addEventListener('input', (e) => {
        speedVal.textContent = `${e.target.value}x`;
    });
}

// Confirmar y Liberar Pez
if (btnConfirmSpawn) {
    btnConfirmSpawn.addEventListener('click', () => {
        const name = fishNameInput.value.trim() || undefined;
        const size = parseFloat(fishSizeSlider.value) || 1.1;
        const speed = parseFloat(fishSpeedSlider.value) || 1.2;

        socket.emit('add_fish', {
            type: selectedType,
            name,
            color: selectedColor,
            size,
            speed
        });

        // Limpiar input y cerrar
        fishNameInput.value = '';
        closeModal();
    });
}
