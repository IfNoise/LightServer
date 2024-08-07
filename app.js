const express = require("express");
const {Router}= require('express');
const router=Router();
const cors = require("cors");
const port = 4000;
const path = require("path")
const config = require("config");
const DeviceManager = require("./models/DeviceManager");
const TimerManager = require("./models/TimerManager");
const ChannelsManager = require("./models/ChannelsManager");
const bodyParser = require("body-parser");
//=========================================================
const app = express();
const deviceManager = DeviceManager.getInstance();
deviceManager.init();

let channelManager = ChannelsManager.getInstance(deviceManager);
channelManager.init();

let timerManager = TimerManager.getInstance(channelManager);
timerManager.init();


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ extended: true }));



app.use("/api/devices", require("./routes/devices.route"));
app.use("/api/timers", require("./routes/timers.route"));
app.use("/api/lightChannels", require("./routes/lightChannels.route"));
app.listen(port, () => {
  console.log(`Server app listening at ${port} port`);
})
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


