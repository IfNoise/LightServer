import 'dotenv/config';
import express, { Router } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import DeviceManager from "./models/DeviceManager.js";
import TimerManager from "./models/TimerManager.js";
import ChannelsManager from "./models/ChannelsManager.js";
import bodyParser from "body-parser";
import apiRouter from "./routes/index.js";
import logger from "./config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = JSON.parse(readFileSync(join(__dirname, '../swagger.json'), 'utf-8'));

const port = process.env.PORT || 3000;
//=========================================================
const app = express();
const deviceManager = DeviceManager.getInstance();
deviceManager.init();

const channelManager = ChannelsManager.getInstance(deviceManager);
channelManager.init();

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

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`, { signal });
  server.close(() => {
    logger.info("Closed out remaining connections.");
    process.exit(0);
  });

  // Если через 10 секунд сервер не завершился, принудительно завершить процесс
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));



