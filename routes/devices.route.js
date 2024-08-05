const {Router}= require('express');
const router = Router();
const DeviceManager = require('../models/DeviceManager');

const deviceManager = DeviceManager.getInstance();

router.get("/", (req, res) => {
  res.json(DeviceManager.getDevices());
}
);
router.get("/:name", (req, res) => {
  const { name } = req.params;
  const device = DeviceManager.getDevice(name);
  if (device) {
    res.json(device.json());
  } else {
    res.json({ status: "error" });
  }
});
router.get("/:name/state", async (req, res) => {
  const { name } = req.params;
  const device = DeviceManager.getDevice(name);
  if (device) {
    const state = await device.requestState();
    res.json({state});
  } else {
    res.json({ status: "error" });
  }
});
router.post("/api/devices/add", (req, res) => {
  const { name, address, port } = req.body;
  deviceManager.addDevice(name, { host: address, port });
  res.json({ status: "ok" });
});

router.post("/api/devices/remove", (req, res) => {
  const { name } = req.body;
  const device = deviceManager.getDevice(name);
  if (device) {
    deviceManager.removeDevice(device);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});
module.exports = router;


