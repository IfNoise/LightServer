import 'dotenv/config';
import express, { Router } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from 'fs';
import DeviceManager from "./models/DeviceManager.js";
import TimerManager from "./models/TimerManager.js";
import ChannelsManager from "./models/ChannelsManager.js";
import bodyParser from "body-parser";
import devicesRouter from "./routes/devices.route.js";
import timersRouter from "./routes/timers.route.js";
import lightChannelsRouter from "./routes/lightChannels.route.js";

const swaggerDocument = JSON.parse(readFileSync('./swagger.json', 'utf-8'));

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

app.use("/api/devices", devicesRouter);
app.use("/api/timers", timersRouter);
app.use("/api/lightChannels", lightChannelsRouter);

const server = app.listen(port, () => {
  console.log(`Server app listening at ${port} port`);
});

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("Closed out remaining connections.");
    process.exit(0);
  });

  // Если через 10 секунд сервер не завершился, принудительно завершить процесс
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));



