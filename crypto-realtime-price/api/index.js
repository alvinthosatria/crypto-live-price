import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import * as dotenv from "dotenv";
import fetch from "node-fetch";
import { createClient } from "redis";

dotenv.config();

const app = express();
const apiKey = process.env.API_KEY;
const PORT1 = process.env.PORT_ONE ?? 8800;
const PORT2 = process.env.PORT_TWO ?? 8801;
const DEFAULT_EXPIRATION = 19;

//middleware
app.use(express.json());
const redisClient = createClient();

(async () => {
  await redisClient.connect();
})();

redisClient.on("ready", () => {
  console.log("Connected to Redis!");
});

//Initialize WebSocket connection
const httpServer = http.createServer(app);
const wss = new WebSocketServer({
  server: httpServer,

  //handshake connection with NGINX proxy server
  verifyClient: (info, cb) => {
    const forwardedFor = info.req.headers["x-forwarded-for"];
    if (forwardedFor) {
      info.req.remoteAddress = forwardedFor.split(",")[0];
    }
    cb(true);
  },
});

const requestOptions = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "Accept-Encoding": "gzip",
  },
};

let priceUsd;
let volumeUsd;
let changePercent;

const convertItem = (item) => {
  priceUsd = parseFloat(item.priceUsd).toFixed(8).toString();
  volumeUsd = parseFloat(item.volumeUsd24Hr).toFixed(8).toString();
  changePercent = parseFloat(item.changePercent24Hr).toFixed(8).toString();
};

const fetchCryptoData = async () => {
  const res = await fetch(
    "https://api.coincap.io/v2/assets?limit=10",
    requestOptions
  );
  if (res.status !== 200)
    throw new Error(`Failed to fetch data. Status code: ${res.status}`);
  const data = await res.json();
  const info = data.data.map((item) => {
    convertItem(item);
    return {
      id: item.id,
      name: item.name,
      price: priceUsd,
      volume: volumeUsd,
      change: changePercent,
    };
  });
  return info;
};

let apiHits = 0;
const request = async (ws) => {
  try {
    const redisCachedData = await redisClient.get("crypto_data");

    if (redisCachedData != null) {
      console.log("Serving redis cached data");
      ws.send(redisCachedData);
      return;
    }

    const info = await fetchCryptoData();
    apiHits++;

    // Create a new cache object with a 19 seconds expiration time because
    // data from CoinCap API is updated every 20 seconds
    await redisClient.setEx(
      "crypto_data",
      DEFAULT_EXPIRATION,
      JSON.stringify(info)
    );

    ws.send(JSON.stringify(info));
  } catch (error) {
    console.error(error);
  }
};

wss.on("connection", (ws) => {
  ws.on("error", console.error);
  console.log("Client connected!");
  request(ws);
  setInterval(() => request(ws), 20000);
  ws.on("disconnect", () => {
    console.log("Client disconnected!");
    redisClient.quit();
  });
});

httpServer.listen(PORT1 || PORT2, () => {
  console.log("Server is running!");
});
