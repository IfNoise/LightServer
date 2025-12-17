const {Router}= require('express');
const router = Router();
const DeviceManager = require('../models/DeviceManager');

const deviceManager = DeviceManager.getInstance();

// RESTful endpoints
router.get("/", (req, res) => {
  res.json(deviceManager.getDevices());
}
);

// RESTful: Create new device
router.post("/", (req, res) => {
  const { name, type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount } = req.body;
  
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
      timeout: timeout || 1000,
      portsCount: portsCount || 8
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
      timeout: timeout || 1000,
      portsCount: portsCount || 8
    };
  }
  
  try {
    deviceManager.addDevice(name, options);
    res.status(201).json({ status: "ok", device: { name, type: options.type } });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
// RESTful: Get single device
router.get("/:name", (req, res) => {
  const { name } = req.params;
  const device = deviceManager.getDevice(name);
  if (device) {
    res.json(device.json());
  } else {
    res.status(404).json({ status: "error", message: "Device not found" });
  }
});
// RESTful: Update device (partial)
router.patch("/:name", (req, res) => {
  const { name } = req.params;
  const device = deviceManager.getDevice(name);
  if (device) {
    const { timeout, port, path, baudRate, dataBits, stopBits, parity, unitId, host } = req.body;
    if (timeout !== undefined) device.options.timeout = timeout;
    if (port !== undefined && device.type === "tcp") device.options.port = port;
    if (host !== undefined && device.type === "tcp") device.options.host = host;
    if (path !== undefined && device.type === "rtu") device.options.path = path;
    if (baudRate !== undefined && device.type === "rtu") device.options.baudRate = baudRate;
    if (dataBits !== undefined && device.type === "rtu") device.options.dataBits = dataBits;
    if (stopBits !== undefined && device.type === "rtu") device.options.stopBits = stopBits;
    if (parity !== undefined && device.type === "rtu") device.options.parity = parity;
    if (unitId !== undefined && device.type === "rtu") device.unitId = unitId;
    
    deviceManager.saveDevices();
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Device not found" });
  }
});

// RESTful: Replace device (full update)
router.put("/:name", (req, res) => {
  const { name } = req.params;
  const device = deviceManager.getDevice(name);
  
  if (!device) {
    return res.status(404).json({ status: "error", message: "Device not found" });
  }
  
  const { type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount } = req.body;
  
  let options = {};
  
  if (type === "rtu") {
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
      timeout: timeout || 1000,
      portsCount: portsCount || 8
    };
  } else {
    if (!address) {
      return res.status(400).json({ status: "error", message: "IP address is required for TCP devices" });
    }
    options = {
      type: "tcp",
      host: address,
      port: port || "502",
      timeout: timeout || 1000,
      portsCount: portsCount || 8
    };
  }
  
  // Remove old device and add new one with same name
  deviceManager.removeDevice(device);
  try {
    deviceManager.addDevice(name, options);
    res.json({ status: "ok", device: { name, type: options.type } });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});
// RESTful: Delete device
router.delete("/:name", (req, res) => {
  const { name } = req.params;
  const device = deviceManager.getDevice(name);
  if (device) {
    deviceManager.removeDevice(device);
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Device not found" });
  }
});
// RESTful: Get device state
router.get("/:name/state", async (req, res) => {
  const { name } = req.params;
  const device = deviceManager.getDevice(name);
  if (device) {
    const state = await device.requestState();
    res.json({state});
  } else {
    res.status(404).json({ status: "error", message: "Device not found" });
  }
});
// Legacy endpoint for backwards compatibility - use POST / instead
router.post("/add", (req, res) => {
  const { name, type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount } = req.body;
  
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
      timeout: timeout || 1000,
      portsCount: portsCount || 8
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
      timeout: timeout || 1000,
      portsCount: portsCount || 8
    };
  }
  
  try {
    deviceManager.addDevice(name, options);
    res.json({ status: "ok", device: { name, type: options.type } });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;


