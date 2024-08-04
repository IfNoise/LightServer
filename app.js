const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const config = require("config");
const DeviceManager = require("./models/DeviceManager");
const Timer = require("./models/Timer");
const TimerManager = require("./models/TimerManager");
const LightChannel = require("./models/LightChannel");
const ChannelsManager = require("./models/ChannelsManager");
const bodyParser = require("body-parser");
const c = require("config");

const deviceManager = new DeviceManager();
deviceManager.init();

const ChannelMgr = new ChannelsManager(deviceManager);
ChannelMgr.init();

const timerManager = new TimerManager(ChannelMgr);
timerManager.init();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ extended: true }));

app.get("/api/devices", (req, res) => {
  res.json(deviceManager.getDevices());
});
app.get("/api/timers", (req, res) => {
  res.json(timerManager.getTimers());
});
app.get("/api/lightChannels", (req, res) => {
  res.json(ChannelMgr.getChannelsJSON());
});
app.get("/api/timers/:name", (req, res) => {
  const { name } = req.params;
  const timer = timerManager.getTimer(name);
  if (timer) {
    res.json(timer.json());
  } else {
    res.json({ status: "error" });
  }
});
app.get("/api/lightChannels/:name", (req, res) => {
  const { name } = req.params;
  const channel = ChannelMgr.getChannel(name);
  if (channel) {
    res.json(channel.json());
  } else {
    res.json({ status: "error" });
  }
});
app.get("/api/lightChannels/:name/state", async (req, res) => {
  const { name } = req.params;
  const channel = ChannelMgr.getChannel(name);
  if (channel) {
    const state = await channel.getState();
    res.json({state});
  } else {
    res.json({ status: "error" });
  }
});
app.get("/api/devices/:name", (req, res) => {
  const { name } = req.params;
  const device = deviceManager.getDevice(name);
  if (device) {
    res.json(device);
  } else {
    res.json({ status: "error" });
  }
});

app.post("/api/devices/add", (req, res) => {
  const { name, address, port } = req.body;
  deviceManager.addDevice(name, { host: address, port });
  res.json({ status: "ok" });
});

app.post("/api/devices/remove", (req, res) => {
  const { name } = req.body;
  const device = deviceManager.getDevice(name);
  if (device) {
    deviceManager.removeDevice(device);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});
app.post("/api/timers/add", (req, res) => {
  const { name, steps, stepTime, sunriseTime, sunsetTime } = req.body;
  timerManager.addTimer(name, steps, stepTime,sunriseTime,sunsetTime);
  res.json({ status: "ok" });
});
app.post("/api/timers/remove", (req, res) => {
  const { name } = req.body;
  timerManager.removeTimer(name);

  res.json({ status: "ok" });
});
app.post("/api/timers/:name/setSteps", (req, res) => {
  const { name } = req.params;
  const { steps } = req.body;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.setSteps(steps);
    timerManager.saveTimers();
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});
app.post("/api/timers/:name/setSunriseTime", (req, res) => {
  const { name } = req.params;
  const { time } = req.body;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.setSunriseTime(time);
    timerManager.saveTimers();
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});
app.post("/api/timers/:name/setSunsetTime", (req, res) => {
  const { name } = req.params;
  const { time } = req.body;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.setSunsetTime(time);
    timerManager.saveTimers();
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});
app.post("/api/timers/:name/setStepTime", (req, res) => {
  const { name } = req.params;
  const { stepTime } = req.body;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.setStepTime(stepTime);
    timerManager.saveTimers();
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});
app.post("/api/timers/:name/subscribe", (req, res) => {
  const { name } = req.params;
  const channels = [...req.body?.channels];
  timerManager.subscribe(name, channels);
  res.json({ status: "ok" });
});
app.post("/api/timers/:name/unsubscribe", (req, res) => {
  const { name } = req.params;
  const channels = [...req.body?.channels];
  timerManager.unsubscribe(name, channels);
  res.json({ status: "ok" });
});

app.post("/api/timers/:name/start", (req, res) => {
  const { name } = req.params;
  timerManager.getTimer(name).start();
  res.json({ status: "ok" });
});

app.post("/api/timers/:name/stop", (req, res) => {
  const { name } = req.params;
  timerManager.getTimer(name).stop();
  res.json({ status: "ok" });
});

app.post("/api/lightChannels/add", (req, res) => {
  const { name, device, port } = req.body;
  const dev = deviceManager.getDevice(device);
  ChannelMgr.addChannel({ name, device: dev, port });
  res.json({ status: "ok" });
});
app.post("/api/lightChannels/remove", (req, res) => {
  const { name } = req.body;
  ChannelMgr.removeChannel(name);
  res.json({ status: "ok" });
});
app.post("/api/lightChannels/:name/setMaxLevel", (req, res) => {
  const { name } = req.params;
  const { maxLevel } = req.body;
  const channel = ChannelMgr.getChannel(name);
  if (channel) {
    channel.setMaxLevel(maxLevel);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});

app.listen(port, () => {
  console.log(`Server app listening at http://localhost:${port}`);
});
