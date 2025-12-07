const {Router}= require('express');
const router = Router();
const DeviceManager = require('../models/DeviceManager');

const deviceManager = DeviceManager.getInstance();

router.get("/", (req, res) => {
  res.json(deviceManager.getDevices());
}
);
router.get("/:name", (req, res) => {
  const { name } = req.params;
  const device = deviceManager.getDevice(name);
  if (device) {
    res.json(device.json());
  } else {
    res.json({ status: "error" });
  }
});
router.get("/:name/state", async (req, res) => {
  const { name } = req.params;
  const device = deviceManager.getDevice(name);
  if (device) {
    const state = await device.requestState();
    res.json({state});
  } else {
    res.json({ status: "error" });
  }
});
router.post("/add", (req, res) => {
  const { name, type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout } = req.body;
  
  // Validate required fields based on device type
  if (!name) {
    return res.status(400).json({ status: "error", message: "Device name is required" });
  }
  
  let options = {};
  
  if (type === "rtu") {
    // Serial/RTU device
    if (!path) {
      return res.status(400).json({ status: "error", message: "Serial port path is required for RTU devices" });
    }
    options = {
      type: "rtu",
      path: path,
      baudRate: baudRate || 9600,
      dataBits: dataBits || 8,
      stopBits: stopBits || 1,
      parity: parity || "none",
      unitId: unitId || 1,
      timeout: timeout || 1000
    };
  } else {
    // TCP device (default)
    if (!address) {
      return res.status(400).json({ status: "error", message: "IP address is required for TCP devices" });
    }
    options = {
      type: "tcp",
      host: address,
      port: port || "502",
      timeout: timeout || 1000
    };
  }
  
  try {
    deviceManager.addDevice(name, options);
    res.json({ status: "ok", device: { name, type: options.type } });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/remove", (req, res) => {
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


