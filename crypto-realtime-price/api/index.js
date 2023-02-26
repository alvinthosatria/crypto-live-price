import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import * as redis from 'redis';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const apiKey = process.env.API_KEY;

//middleware
app.use(express.json());

const httpServer = http.createServer(app);
const wss = new WebSocketServer({server: httpServer});

const client = redis.createClient({
    host: "localhost",
    port: 6379
});

client.connect();

const requestOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Accept-Encoding': 'gzip',
  }
};

let apiHits = 0;
const request = async (ws) => {
  try {
    console.log("hello")
    client.get('crypto_data', async (err, cachedData) => {
        if (cachedData) {
            console.log('Serving cached data');
            ws.send(cachedData);
            return;
        }

        const res = await fetch('https://api.coincap.io/v2/assets?limit=10', requestOptions);
        if (res.status !== 200) throw new Error(`Failed to fetch data. Status code: ${res.status}`);
        apiHits++;
        console.log(apiHits);
        const data = await res.json();
        const info = data.data.map((item) => {
            let priceUsd = parseFloat(item.priceUsd).toFixed(8).toString();
            let volumeUsd = parseFloat(item.volumeUsd24Hr).toFixed(8).toString();
            let changePercent = parseFloat(item.changePercent24Hr).toFixed(8).toString();
            return {
                id: item.id,
                name: item.name,
                price: priceUsd,
                volume: volumeUsd,
                change: changePercent,
            };
        });

        client.set('crypto_data', JSON.stringify(info), 'EX', 20, (err, reply) => {
        console.log(`Redis cache set with reply: ${reply}`);
    });

    ws.send(JSON.stringify(info));
    });
  } catch (error) {
    console.error(error);
  }
};

wss.on('connection', (ws) => {
    ws.on('error', console.error);
    console.log('Client connected!');
    request(ws);
    setInterval(() => request(ws), 20000);
    ws.on('disconnect', () => {
        console.log('Client disconnected!');
        client.quit();
    });
});


httpServer.listen(8800, () => {
  console.log('Server running!')
});

client.on('error', (error) => {
    console.error('Redis client error:', error);
});