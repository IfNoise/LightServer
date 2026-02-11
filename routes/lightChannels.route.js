import { Router } from "express";
import DeviceManager from "../models/DeviceManager.js";
import ChannelsManager from "../models/ChannelsManager.js";

const router = Router();

const deviceManager = DeviceManager.getInstance();
const channelManager = ChannelsManager.getInstance(deviceManager);

// RESTful: Get all channels
router.get("/", (req, res) => {
  res.json(channelManager.getChannelsJSON());
});

// RESTful: Create new channel
router.post("/", (req, res) => {
  const { name, device, port } = req.body;

  if (!name) {
    return res.status(400).json({ status: "error", message: "Channel name is required" });
  }
  if (!device) {
    return res.status(400).json({ status: "error", message: "Device name is required" });
  }
  if (port === undefined) {
    return res.status(400).json({ status: "error", message: "Port number is required" });
  }

  const result = channelManager.addChannel({ name, device, port });
  if (result.status === "ok") {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

// RESTful: Get all channels state
router.get("/state", async (req, res) => {
  if (channelManager.channels.length === 0) {
    res.status(404).json({ status: "error", message: "No channels found" });
    return;
  }
  const state = await channelManager.getChannelsState();
  console.log(state);
  res.json(state);
});

// RESTful: Get single channel
router.get("/:name", (req, res) => {
  const { name } = req.params;
  const channel = channelManager.getChannel(name);
  if (channel) {
    res.json(channel.json());
  } else {
    res.status(404).json({ status: "error", message: "Channel not found" });
  }
});

// RESTful: Get channel state
router.get("/:name/state", async (req, res) => {
  const { name } = req.params;
  const channel = channelManager.getChannel(name);
  if (channel) {
    const state = await channel.getState();
    res.json({ state });
  } else {
    res.status(404).json({ status: "error", message: "Channel not found" });
  }
});

// Legacy endpoint for backwards compatibility - use POST / instead
router.post("/add", (req, res) => {
  const { name, device, port } = req.body;

  const result = channelManager.addChannel({ name, device, port });
  res.json(result);
});

// Legacy endpoint for backwards compatibility - use DELETE /:name instead
router.post("/remove", (req, res) => {
  const { name } = req.body;
  if (name) {
    const result = channelManager.removeChannel(name);
    res.json(result);
  } else {
    res.status(400).json({ status: "error", message: "Channel name is required" });
  }
});
// RESTful: Delete channel
router.delete("/:name", (req, res) => {
  const { name } = req.params;
  const result = channelManager.removeChannel(name);
  if (result.status === "ok") {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// Legacy endpoint for backwards compatibility - use PATCH /:name instead
router.post("/:name/setMaxLevel", async (req, res) => {
  const { name } = req.params;
  const { maxLevel } = req.body;
  const channel = channelManager.getChannel(name);
  if (channel) {
    const result = await channel.setMaxLevel(maxLevel);
    res.json(result);
  } else {
    res.status(404).json({ status: "error", message: "Channel not found" });
  }
});

// Legacy endpoint for backwards compatibility - use PATCH /:name instead
router.post("/:name/setPort", (req, res) => {
  const { name } = req.params;
  const { port } = req.body;
  const channel = channelManager.getChannel(name);
  if (channel) {
    channel.setPort(port);
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Channel not found" });
  }
});
// RESTful: Update channel (partial)
router.patch("/:name", (req, res) => {
  const { name } = req.params;
  const channel = channelManager.getChannel(name);
  if (channel) {
    const { maxLevel, port } = req.body;
    if (maxLevel !== undefined) channel.maxLevel = maxLevel;
    if (port !== undefined) channel.port = port;

    channelManager.saveChannels();
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: "Channel not found" });
  }
});

// RESTful: Replace channel (full update)
router.put("/:name", (req, res) => {
  const { name } = req.params;
  const channel = channelManager.getChannel(name);
  
  if (!channel) {
    return res.status(404).json({ status: "error", message: "Channel not found" });
  }
  
  const { device, port, maxLevel } = req.body;
  
  if (!device) {
    return res.status(400).json({ status: "error", message: "Device name is required" });
  }
  if (port === undefined) {
    return res.status(400).json({ status: "error", message: "Port number is required" });
  }
  
  // Remove and recreate channel
  channelManager.removeChannel(name);
  const result = channelManager.addChannel({ name, device, port });
  
  if (result.status === "ok" && maxLevel !== undefined) {
    const newChannel = channelManager.getChannel(name);
    if (newChannel) {
      newChannel.maxLevel = maxLevel;
      channelManager.saveChannels();
    }
  }
  
  if (result.status === "ok") {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// Legacy endpoint for backwards compatibility - use PATCH /:name or PUT /:name instead
router.post("/:name/setDevice", (req, res) => {
  const { name } = req.params;
  const { device: deviceName } = req.body;
  const channel = channelManager.getChannel(name);
  const device = deviceManager.getDevice(deviceName);
  if (channel && device) {
    channel.setDevice(device);
    res.json({ status: "ok" });
  } else {
    res.status(404).json({ status: "error", message: channel ? "Device not found" : "Channel not found" });
  }
});

export default router;
