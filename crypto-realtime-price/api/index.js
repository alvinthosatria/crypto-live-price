import express from 'express';
import http from 'http';
import https from 'https';
import { WebSocketServer } from 'ws';

const app = express();

//middleware
app.use(express.json());

const httpServer = http.createServer(app);
const wss = new WebSocketServer({server: httpServer});

var requestOptions = {
    hostname: "api.coincap.io",
    method: 'GET',
    port: 443,
    redirect: 'follow',
    path: '/v2/assets?limit=10',
};

const request = (ws) => {
    https.request(requestOptions, (res) => {
        let str = '';
        res.on('data', (chunk) => (str += chunk));
        res.on('end', () => {
            const info = JSON.parse(str).data.map((item) => {
                let priceUsd = parseFloat(item.priceUsd).toFixed(8).toString();
                let volumeUsd = parseFloat(item.volumeUsd24Hr).toFixed(8).toString();
                let changePercent = parseFloat(item.changePercent24Hr).toFixed(8).toString();
                return {
                    id: item.id,
                    name: item.name,
                    price: priceUsd,
                    volume: volumeUsd,
                    change: changePercent,
                }
            });
            console.log(info);
            ws.send(JSON.stringify(info));
        })
    }).end();
}

wss.on('connection', (ws) => {
    ws.on('error', console.error);
    console.log('Client connected!');
    request(ws);
    setInterval(() => request(ws), 20000);
    ws.on('disconnect', () => {
        console.log('Client disconnected!');
    })
})

httpServer.listen(8800, () => {
    console.log("Server running!")
});