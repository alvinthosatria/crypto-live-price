import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';

dotenv.config();

const app = express();
const apiKey = process.env.API_KEY;

//middleware
app.use(express.json());

const httpServer = http.createServer(app);
const wss = new WebSocketServer({
  server: httpServer,

  //handshake connection with NGINX proxy server
  verifyClient: (info, cb) => {
    const forwardedFor = info.req.headers['x-forwarded-for'];
    if (forwardedFor) {
      info.req.remoteAddress = forwardedFor.split(',')[0];
    }
    cb(true);
  }
});

const requestOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Accept-Encoding': 'gzip',
  }
};

// Create a new cache object with a  19 seconds expiration time because
// data from CoinCap API is updated every 20 seconds
const cache = new NodeCache({ stdTTL: 19 })

let apiHits = 0;
const request = async (ws) => {
  try {
    const cachedData = cache.get("crypto_data");
    if (cachedData) {
      console.log("Serving cached data");
      ws.send(JSON.stringify(cachedData));
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
    cache.set("crypto_data", info);
    ws.send(JSON.stringify(info));
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
  console.log('Server is running!')
});