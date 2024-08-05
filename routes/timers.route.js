const {Router}= require('express');
const router = Router();
const ChannelsManager = require('../models/ChannelsManager');
const TimerManager = require('../models/TimerManager');

const cannalsManager = ChannelsManager.getInstance();
const timerManager = TimerManager.getInstance(cannalsManager);

router.get("/", (req, res) => {
  res.json(timerManager.getTimers());
}
);

router.get("/:name", (req, res) => {
  const { name } = req.params;
  const timer = timerManager.getTimer(name);
  if (timer) {
    res.json(timer.json());
  } else {
    res.json({ status: "error" });
  }
});

router.post("/add", (req, res) => {
  const { name, steps, stepTime, sunriseTime, sunsetTime } = req.body;
  timerManager.addTimer(name, steps, stepTime, sunriseTime, sunsetTime);
  res.json({ status: "ok" });
});

router.post("/remove", (req, res) => {
  const { name } = req.body;
  timerManager.removeTimer(name);

  res.json({ status: "ok" });
});

router.post("/:name/setSteps", (req, res) => {
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

router.post("/:name/setSunriseTime", (req, res) => {
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

router.post("/:name/setSunsetTime", (req, res) => {
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

router.post("/:name/setStepTime", (req, res) => {
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

router.post("/:name/subscribe", (req, res) => {
  const { name } = req.params;
  const channels = [...req.body?.channels];
  timerManager.subscribe(name, channels);
  res.json({ status: "ok" });
});

router.post("/:name/unsubscribe", (req, res) => {
  const { name } = req.params;
  const channels = [...req.body?.channels];
  timerManager.unsubscribe(name, channels);
  res.json({ status: "ok" });
});

router.post("/:name/start", (req, res) => {
  const { name } = req.params;
  timerManager.getTimer(name).start();
  res.json({ status: "ok" });
});

router.post("/:name/stop", (req, res) => {
  const { name } = req.params;
  timerManager.getTimer(name).stop();
  res.json({ status: "ok" });
});

module.exports = router;

