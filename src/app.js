import 'dotenv/config';
import express, { Router } from "express";
import { createServer } from 'http';
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import DeviceManager from "./models/DeviceManager.js";
import TimerManager from "./models/TimerManager.js";
import ChannelsManager from "./models/ChannelsManager.js";
import WebSocketService from "./services/WebSocketService.js";
import bodyParser from "body-parser";
import apiRouter from "./routes/index.js";
import logger from "./config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = JSON.parse(readFileSync(join(__dirname, '../swagger.json'), 'utf-8'));

const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 3001;
//=========================================================
const app = express();
const deviceManager = DeviceManager.getInstance();
deviceManager.init();

const channelManager = ChannelsManager.getInstance(deviceManager);
channelManager.loadChannelsWithEvents();

const timerManager = TimerManager.getInstance(channelManager);
timerManager.init();


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ extended: true }));

// Swagger API Documentation
const modifiedSwaggerDoc = {
  ...swaggerDocument,
  servers: [
    {
      url: `${process.env.API_BASE_URL || "http://localhost:" + port}${process.env.API_BASE_PATH || "/api"}`,
      description: "LightServer API"
    },
  ],
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(modifiedSwaggerDoc, {
  customSiteTitle: "LightServer API Documentation",
  customCss: '.swagger-ui .topbar { display: none }'
}));

app.use("/api", apiRouter);

const server = app.listen(port, () => {
  logger.info(`Server app listening at ${port} port`, { port });
});

// Создаем отдельный HTTP сервер для WebSocket
const wsApp = express();
const wsServer = createServer(wsApp);

// Инициализация WebSocket сервиса на отдельном порту
const wsService = WebSocketService.getInstance();
wsService.init(wsServer, wsPort);

// Подписка на события каналов
channelManager.on('channel:updated', ({ name, state }) => {
  wsService.broadcastChannelUpdate(name, state);
});

channelManager.on('channel:added', (channel) => {
  wsService.broadcastChannelAdded(channel);
});

channelManager.on('channel:removed', (channelName) => {
  wsService.broadcastChannelRemoved(channelName);
});

logger.info('WebSocket integration initialized');

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`, { signal });
  
  // Закрываем WebSocket соединения
  wsService.shutdown();
  
  // Закрываем оба сервера
  let httpClosed = false;
  let wsClosed = false;
  
  const checkBothClosed = () => {
    if (httpClosed && wsClosed) {
      logger.info("All servers closed.");
      process.exit(0);
    }
  };
  
  server.close(() => {
    logger.info("HTTP server closed.");
    httpClosed = true;
    checkBothClosed();
  });
  
  wsServer.close(() => {
    logger.info("WebSocket server closed.");
    wsClosed = true;
    checkBothClosed();
  });

  // Если через 10 секунд серверы не завершились, принудительно завершить процесс
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));



