const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 2470;

// ==========================================================
// INTEGRACIÓN DE TELEGRAM BOT (@pecera24_bot)
// ==========================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8903178207:AAEFAlviXYg5KLTk3ZLDp8U2rX2cruzgpjc';
const CHATS_FILE = path.join(__dirname, 'telegram_chats.json');

// Conjunto de Chat IDs registrados para recibir alertas
let registeredChatIds = new Set();
try {
    if (fs.existsSync(CHATS_FILE)) {
        const saved = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
        if (Array.isArray(saved)) {
            saved.forEach(id => registeredChatIds.add(id));
        }
    }
} catch (e) {
    console.warn('[TELEGRAM] Aviso: No se pudo leer telegram_chats.json:', e.message);
}

if (process.env.TELEGRAM_CHAT_ID) {
    registeredChatIds.add(process.env.TELEGRAM_CHAT_ID);
}

function saveRegisteredChats() {
    try {
        fs.writeFileSync(CHATS_FILE, JSON.stringify(Array.from(registeredChatIds), null, 2), 'utf-8');
    } catch (e) {
        console.warn('[TELEGRAM] Error guardando telegram_chats.json:', e.message);
    }
}

let lastTelegramUpdateId = 0;

// Función para enviar mensaje directo por Telegram
async function sendTelegramMessage(chatId, htmlText) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: htmlText,
                parse_mode: 'HTML'
            })
        });
        const data = await res.json();
        return data.ok;
    } catch (err) {
        console.error(`[TELEGRAM] Error de red enviando mensaje a ${chatId}:`, err.message);
        return false;
    }
}

// Sondeo de mensajes para vincular automáticamente a cualquier usuario que hable con el bot
async function checkTelegramUpdates() {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastTelegramUpdateId + 1}&timeout=3`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
                lastTelegramUpdateId = update.update_id;
                const msg = update.message;
                if (msg && msg.chat && msg.chat.id) {
                    const chatId = msg.chat.id;
                    const isNew = !registeredChatIds.has(chatId);
                    registeredChatIds.add(chatId);
                    saveRegisteredChats();

                    if (isNew) {
                        const userName = msg.from ? (msg.from.first_name || msg.from.username || 'Explorador') : 'Explorador';
                        console.log(`[TELEGRAM] 📱 Nuevo chat vinculado: ${chatId} (${userName})`);
                        // Mensaje de bienvenida confirmando la vinculación
                        sendTelegramMessage(chatId,
                            `🪐 <b>¡Hola ${userName}!</b>\n\n` +
                            `Te has conectado con éxito a las notificaciones de <b>SATURNO 3D</b> 🐠.\n` +
                            `A partir de ahora, cada vez que alguien libere un pez en la pecera, te avisaré por aquí en tiempo real.`
                        );
                    }
                }
            }
        }
    } catch (err) {
        // Silenciar errores temporales de conexión
    }
}

// Iniciar polling de Telegram cada 5 segundos
setInterval(checkTelegramUpdates, 5000);
checkTelegramUpdates();

// Notificar a todos los chats cuando se agrega un pez
async function notifyNewFishTelegram(fish, ownerName) {
    // Si aún no hay chats registrados, intentar sincronizar primero
    if (registeredChatIds.size === 0) {
        await checkTelegramUpdates();
    }

    if (registeredChatIds.size === 0) {
        console.log(`[TELEGRAM] ⚠️ No hay Chat ID registrado aún.`);
        console.log(`[TELEGRAM] 💡 Envía /start a @pecera24_bot en Telegram para recibir las alertas.`);
        return;
    }

    const speciesNames = {
        'clownfish': 'Pez Payaso 🐠',
        'angelfish': 'Pez Ángel 🐟',
        'bluetang': 'Cirujano Azul 🐡',
        'pufferfish': 'Pez Globo 🐡',
        'goldfish': 'Pez Dorado ✨'
    };

    const speciesLabel = speciesNames[fish.type] || `${fish.type} 🐟`;
    const nowTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const message = 
`🪐 <b>¡NUEVO PEZ EN SATURNO 3D!</b> 🐠\n` +
`━━━━━━━━━━━━━━━━━━━\n` +
`🐟 <b>Nombre:</b> ${fish.name}\n` +
`🏷️ <b>Especie:</b> ${speciesLabel}\n` +
`🎨 <b>Color:</b> <code>${fish.color}</code>\n` +
`📏 <b>Tamaño:</b> ${fish.size}x\n` +
`⚡ <b>Velocidad:</b> ${fish.speed}x\n` +
`👤 <b>Liberado por:</b> ${ownerName || 'Usuario'}\n` +
`⏰ <b>Hora:</b> ${nowTime}\n` +
`━━━━━━━━━━━━━━━━━━━\n` +
`🌊 <i>¡Entra a la pecera para interactuar con él!</i>`;

    for (const chatId of registeredChatIds) {
        const ok = await sendTelegramMessage(chatId, message);
        if (ok) {
            console.log(`[TELEGRAM] ✅ Notificación enviada exitosamente a Chat ID: ${chatId}`);
        }
    }
}

// Servir la carpeta public estática
app.use(express.static(path.join(__dirname, 'public')));

// Servir la librería Three.js desde node_modules
app.use('/three', express.static(path.join(__dirname, 'node_modules', 'three')));

// Dimensiones de la pecera gigante (Límites 3D)
const TANK_BOUNDS = {
    minX: -14, maxX: 14,
    minY: -6.5, maxY: 6.5,
    minZ: -9.5, maxZ: 9.5
};

// Colores vibrantes para los usuarios
const USER_COLORS = [
    '#00f0ff', '#ff007f', '#00ff88', '#ffb703',
    '#a855f7', '#ff4d6d', '#38bdf8', '#fbbf24',
    '#4ade80', '#e879f9', '#2dd4bf', '#f43f5e'
];

const NICKNAMES = [
    'Buzo Neptuno', 'Capitana Coral', 'Explorador Abisal',
    'Delfín Neón', 'Sirena Mística', 'Tiburón Veloz',
    'Biólogo Marino', 'Guardián del Arrecife', 'Navegante Poseidón',
    'Pez Estrella', 'Manta Ray', 'Pulpo Sabio'
];

// Estado global de la aplicación
const connectedUsers = new Map();
const fishes = new Map();

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomTarget() {
    return {
        x: getRandomNumber(TANK_BOUNDS.minX + 2, TANK_BOUNDS.maxX - 2),
        y: getRandomNumber(TANK_BOUNDS.minY + 1.5, TANK_BOUNDS.maxY - 1.5),
        z: getRandomNumber(TANK_BOUNDS.minZ + 2, TANK_BOUNDS.maxZ - 2)
    };
}

// Inicializar peces de inicio variados
const starterFishes = [
    { type: 'clownfish', name: 'Nemo', color: '#ff6600', size: 1.1, speed: 1.3 },
    { type: 'clownfish', name: 'Marlin', color: '#ff7722', size: 1.25, speed: 1.1 },
    { type: 'angelfish', name: 'Ángel Real', color: '#dbeafe', size: 1.2, speed: 0.95 },
    { type: 'angelfish', name: 'Plata Luminosa', color: '#e2e8f0', size: 1.0, speed: 1.05 },
    { type: 'bluetang', name: 'Dory', color: '#2563eb', size: 1.15, speed: 1.4 },
    { type: 'pufferfish', name: 'Globito', color: '#84cc16', size: 1.2, speed: 0.85 },
    { type: 'pufferfish', name: 'Puff', color: '#a3e635', size: 0.95, speed: 0.9 },
    { type: 'goldfish', name: 'Aura Dorada', color: '#f59e0b', size: 1.3, speed: 1.0 },
    { type: 'goldfish', name: 'Destello', color: '#f97316', size: 1.05, speed: 1.2 }
];

let fishIdCounter = 1;

starterFishes.forEach(sf => {
    const id = `fish_${fishIdCounter++}`;
    const target = getRandomTarget();
    const spawnPos = getRandomTarget();
    fishes.set(id, {
        id,
        type: sf.type,
        name: sf.name,
        color: sf.color,
        size: sf.size,
        speed: sf.speed,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        targetX: target.x,
        targetY: target.y,
        targetZ: target.z,
        ownerName: 'Sistema'
    });
});

// Actualizador periódico de trayectorias de peces en el servidor
setInterval(() => {
    const updates = [];
    fishes.forEach(fish => {
        // Calcular vector hacia el objetivo
        const dx = fish.targetX - fish.x;
        const dy = fish.targetY - fish.y;
        const dz = fish.targetZ - fish.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Si ya llegó o está cerca del objetivo, asignar uno nuevo
        if (dist < 2.0 || Math.random() < 0.08) {
            const nextTarget = getRandomTarget();
            fish.targetX = nextTarget.x;
            fish.targetY = nextTarget.y;
            fish.targetZ = nextTarget.z;
        }

        // Avance suave
        const moveDist = fish.speed * 0.4;
        if (dist > 0.1) {
            fish.x += (dx / dist) * Math.min(dist, moveDist);
            fish.y += (dy / dist) * Math.min(dist, moveDist);
            fish.z += (dz / dist) * Math.min(dist, moveDist);
        }

        updates.push({
            id: fish.id,
            x: Number(fish.x.toFixed(2)),
            y: Number(fish.y.toFixed(2)),
            z: Number(fish.z.toFixed(2)),
            targetX: Number(fish.targetX.toFixed(2)),
            targetY: Number(fish.targetY.toFixed(2)),
            targetZ: Number(fish.targetZ.toFixed(2)),
            speed: fish.speed
        });
    });

    if (updates.length > 0) {
        io.emit('fishes_heartbeat', updates);
    }
}, 1000);

// Manejo de conexiones Socket.io
io.on('connection', (socket) => {
    const colorIndex = Math.floor(Math.random() * USER_COLORS.length);
    const nickIndex = Math.floor(Math.random() * NICKNAMES.length);
    const userNumber = Math.floor(Math.random() * 900) + 100;

    const user = {
        id: socket.id,
        name: `${NICKNAMES[nickIndex]} #${userNumber}`,
        color: USER_COLORS[colorIndex],
        x: 0,
        y: 0,
        nx: 0.5,
        ny: 0.5,
        worldPos: { x: 0, y: 0, z: 0 }
    };

    connectedUsers.set(socket.id, user);
    console.log(`[CONEXIÓN] Cliente conectado: ${user.name} (${socket.id})`);

    // Enviar estado inicial completo al nuevo cliente
    socket.emit('init_state', {
        self: user,
        users: Array.from(connectedUsers.values()),
        fishes: Array.from(fishes.values()),
        tankBounds: TANK_BOUNDS
    });

    // Notificar a los demás usuarios sobre el nuevo cliente
    socket.broadcast.emit('user_joined', user);

    // Movimiento del cursor del cliente
    socket.on('cursor_move', (data) => {
        const u = connectedUsers.get(socket.id);
        if (u) {
            u.x = data.x;
            u.y = data.y;
            u.nx = data.nx;
            u.ny = data.ny;
            u.worldPos = data.worldPos;

            // Retransmitir a los otros clientes
            socket.broadcast.emit('cursor_moved', {
                id: socket.id,
                name: u.name,
                color: u.color,
                x: data.x,
                y: data.y,
                nx: data.nx,
                ny: data.ny,
                worldPos: data.worldPos
            });
        }
    });

    // Click del mouse de un cliente
    socket.on('cursor_click', (data) => {
        const u = connectedUsers.get(socket.id);
        if (u) {
            io.emit('cursor_clicked', {
                id: socket.id,
                name: u.name,
                color: u.color,
                x: data.x,
                y: data.y,
                nx: data.nx,
                ny: data.ny,
                worldPos: data.worldPos
            });
        }
    });

    // Agregar nuevo pez a la pecera
    socket.on('add_fish', (data) => {
        const u = connectedUsers.get(socket.id);
        const id = `fish_${fishIdCounter++}`;
        const target = getRandomTarget();
        const spawnPos = {
            x: getRandomNumber(-5, 5),
            y: TANK_BOUNDS.maxY - 1, // Entra desde la superficie
            z: getRandomNumber(-4, 4)
        };

        const newFish = {
            id,
            type: data.type || 'clownfish',
            name: (data.name && data.name.trim()) ? data.name.trim() : `Pez de ${u ? u.name : 'Anónimo'}`,
            color: data.color || '#ff6600',
            size: Number(data.size) || 1.0,
            speed: Number(data.speed) || 1.2,
            x: spawnPos.x,
            y: spawnPos.y,
            z: spawnPos.z,
            targetX: target.x,
            targetY: target.y,
            targetZ: target.z,
            ownerId: socket.id,
            ownerName: u ? u.name : 'Usuario'
        };

        fishes.set(id, newFish);
        console.log(`[PEZ CREADO] ${newFish.name} (${newFish.type}) por ${newFish.ownerName}`);

        // Difundir el nuevo pez a todos los clientes conectados
        io.emit('fish_added', newFish);

        // Enviar notificación a Telegram a través del bot @pecera24_bot
        notifyNewFishTelegram(newFish, newFish.ownerName);
    });

    // Interacción al tocar/clickear un pez
    socket.on('interact_fish', (data) => {
        const fish = fishes.get(data.fishId);
        const u = connectedUsers.get(socket.id);
        if (fish) {
            const animTypes = ['somersault', 'spin_dash', 'barrel_roll', 'bubble_frenzy', 'balloon_bounce'];
            const chosenAnim = data.animType || animTypes[Math.floor(Math.random() * animTypes.length)];

            // Cambiar objetivo hacia una dirección evasiva alegre
            const escapeTarget = getRandomTarget();
            fish.targetX = escapeTarget.x;
            fish.targetY = escapeTarget.y;
            fish.targetZ = escapeTarget.z;

            console.log(`[INTERACCIÓN] ${u ? u.name : 'Alguien'} interactuó con ${fish.name} -> Animación: ${chosenAnim}`);

            // Sincronizar la animación a TODOS los clientes conectados
            io.emit('fish_interacted', {
                fishId: fish.id,
                fishName: fish.name,
                animType: chosenAnim,
                userId: socket.id,
                userName: u ? u.name : 'Invitado',
                userColor: u ? u.color : '#00f0ff',
                timestamp: Date.now()
            });
        }
    });

    // Alimentar a los peces (Tirar comida flotante)
    socket.on('feed_tank', (data) => {
        const u = connectedUsers.get(socket.id);
        const foodPellets = [];
        const count = 12;
        const centerX = data && typeof data.x === 'number' ? data.x : 0;
        const centerZ = data && typeof data.z === 'number' ? data.z : 0;

        for (let i = 0; i < count; i++) {
            foodPellets.push({
                id: `food_${Date.now()}_${i}`,
                x: centerX + getRandomNumber(-3, 3),
                y: TANK_BOUNDS.maxY - 0.5,
                z: centerZ + getRandomNumber(-3, 3),
                fallSpeed: getRandomNumber(0.4, 0.9)
            });
        }

        // Hacer que algunos peces naden hacia la comida
        fishes.forEach(fish => {
            if (Math.random() < 0.65) {
                const randomPellet = foodPellets[Math.floor(Math.random() * foodPellets.length)];
                fish.targetX = randomPellet.x;
                fish.targetY = randomPellet.y - 1;
                fish.targetZ = randomPellet.z;
            }
        });

        io.emit('food_dropped', {
            pellets: foodPellets,
            byUser: u ? u.name : 'Alguien',
            userColor: u ? u.color : '#ffb703'
        });
    });

    // Desconexión del cliente
    socket.on('disconnect', () => {
        const u = connectedUsers.get(socket.id);
        console.log(`[DESCONEXIÓN] Cliente desconectado: ${u ? u.name : socket.id}`);
        connectedUsers.delete(socket.id);
        io.emit('user_left', { id: socket.id });
    });
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🐟 SIMULADOR DE PECERA GIGANTE 3D MULTIUSUARIO 🐟`);
    console.log(`Servidor activo en: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
