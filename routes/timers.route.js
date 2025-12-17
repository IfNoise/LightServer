const {Router}= require('express');
const router = Router();
const ChannelsManager = require('../models/ChannelsManager');
const TimerManager = require('../models/TimerManager');

const cannalsManager = ChannelsManager.getInstance();
const timerManager = TimerManager.getInstance(cannalsManager);

// RESTful: Get all timers
router.get("/", (req, res) => {
  res.json(timerManager.getTimers());
}
);

// RESTful: Create new timer
router.post("/", (req, res) => {
  const { name, steps, stepTime, sunriseTime, sunsetTime } = req.body;
  
  if (!name) {
    return res.status(400).json({ status: "error", message: "Timer name is required" });
  }
  
  const result = timerManager.addTimer(name, steps, stepTime, sunriseTime, sunsetTime);
  if (result.status === "ok") {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

// RESTful: Get single timer
router.get("/:name", (req, res) => {
  const { name } = req.params;
  const timer = timerManager.getTimer(name);
  if (timer) {
    res.json(timer.json());
  } else {
    res.status(404).json({ status: "error", message: "Timer not found" });
  }
});

// RESTful: Update timer (partial)
router.patch("/:name", (req, res) => {
  const { name } = req.params;
  const timer = timerManager.getTimer(name);
  
  if (!timer) {
    return res.status(404).json({ status: "error", message: "Timer not found" });
  }
  
  const { steps, stepTime, sunriseTime, sunsetTime } = req.body;
  
  if (steps !== undefined) timer.setSteps(steps);
  if (stepTime !== undefined) timer.setStepTime(stepTime);
  if (sunriseTime !== undefined) timer.setSunriseTime(sunriseTime);
  if (sunsetTime !== undefined) timer.setSunsetTime(sunsetTime);
  
  timerManager.saveTimers();
  res.json({ status: "ok" });
});

// RESTful: Replace timer (full update)
router.put("/:name", (req, res) => {
  const { name } = req.params;
  const timer = timerManager.getTimer(name);
  
  if (!timer) {
    return res.status(404).json({ status: "error", message: "Timer not found" });
  }
  
  const { steps, stepTime, sunriseTime, sunsetTime } = req.body;
  
  // Remove and recreate timer
  timerManager.removeTimer(name);
  const result = timerManager.addTimer(name, steps, stepTime, sunriseTime, sunsetTime);
  
  if (result.status === "ok") {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// RESTful: Delete timer
router.delete("/:name", (req, res) => {
  const result = timerManager.removeTimer(req.params.name);
  if (result.status === "ok") {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// Legacy endpoint for backwards compatibility - use POST / instead
router.post("/add", (req, res) => {
  const { name, steps, stepTime, sunriseTime, sunsetTime } = req.body;
  res.json(timerManager.addTimer(name, steps, stepTime, sunriseTime, sunsetTime));
});

// Legacy endpoint for backwards compatibility - use DELETE /:name instead
router.post("/remove", (req, res) => {
  const { name } = req.body;
  res.json(timerManager.removeTimer(name));
});

// Legacy endpoint for backwards compatibility - use PATCH /:name instead
router.post("/:name/setSteps", (req, res) => {
  const { name } = req.params;
  const { steps } = req.body;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.setSteps(steps);
    timerManager.saveTimers();
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Timer not found" });
  }
});

// Legacy endpoint for backwards compatibility - use PATCH /:name instead
router.post("/:name/setSunriseTime", (req, res) => {
  const { name } = req.params;
  const { time } = req.body;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.setSunriseTime(time);
    timerManager.saveTimers();
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Timer not found" });
  }
});

// Legacy endpoint for backwards compatibility - use PATCH /:name instead
router.post("/:name/setSunsetTime", (req, res) => {
  const { name } = req.params;
  const { time } = req.body;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.setSunsetTime(time);
    timerManager.saveTimers();
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Timer not found" });
  }
});

// Legacy endpoint for backwards compatibility - use PATCH /:name instead
router.post("/:name/setStepTime", (req, res) => {
  const { name } = req.params;
  const { stepTime } = req.body;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.setStepTime(stepTime);
    timerManager.saveTimers();
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Timer not found" });
  }
});

// Timer actions
router.post("/:name/subscribe", (req, res) => {
  const { name } = req.params;
  const channels = req.body?.channels ? [...req.body.channels] : [];
  const result = timerManager.subscribe(name, channels);
  if (result.status === "ok") {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

router.post("/:name/unsubscribe", (req, res) => {
  const { name } = req.params;
  const channels = req.body?.channels ? [...req.body.channels] : [];
  const result = timerManager.unsubscribe(name, channels);
  if (result.status === "ok") {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

router.post("/:name/start", (req, res) => {
  const { name } = req.params;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.start();
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Timer not found" });
  }
});

router.post("/:name/stop", (req, res) => {
  const { name } = req.params;
  const timer = timerManager.getTimer(name);
  if (timer) {
    timer.stop();
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Timer not found" });
  }
});

module.exports = router;

