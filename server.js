const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let connectedDevices = [];

io.on('connection', (socket) => {
    socket.on('register_phone', (data) => {
        socket.deviceName = data.name || "Android Device";
        socket.deviceIp = socket.handshake.address;

        connectedDevices = connectedDevices.filter(dev => dev.id !== socket.id);
        
        connectedDevices.push({ 
            id: socket.id, 
            name: socket.deviceName, 
            ip: socket.deviceIp 
        });
        
        io.emit('update_devices', connectedDevices);
    });

    socket.on('send_command_to_device', (data) => {
        io.to(data.targetId).emit('command_to_phone', { action: data.action });
    });

    socket.on('phone_response', (response) => {
        io.emit('phone_response', response);
    });

    socket.on('screen_frame', (base64Frame) => {
        io.emit('screen_frame', base64Frame);
    });

    socket.on('disconnect', () => {
        connectedDevices = connectedDevices.filter(dev => dev.id !== socket.id);
        io.emit('update_devices', connectedDevices);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor MirrorDark corriendo en el puerto ${PORT}`);
});