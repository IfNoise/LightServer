const {Router}= require('express');
const router = Router();
const DeviceManager = require('../models/DeviceManager');
const ChannelsManager = require('../models/ChannelsManager');

const deviceManager = DeviceManager.getInstance();
const channelManager = ChannelsManager.getInstance(deviceManager);

router.get("/", (req, res) => {
  res.json(channelManager.getChannelsJSON());
}
);

router.get("/:name", (req, res) => {
  const { name } = req.params;
  const channel = channelManager.getChannel(name);
  if (channel) {
    res.json(channel.json());
  } else {
    res.json({ status: "error" });
  }
});

router.get("/:name/state", async (req, res) => {
  const { name } = req.params;
  const channel = channelManager.getChannel(name);
  if (channel) {
    const state = await channel.getState();
    res.json({state});
  } else {
    res.json({ status: "error" });
  }
});

router.post("/add", (req, res) => {
  const { name, device:deviceName, port } = req.body;
  const device=deviceManager.getDevice(deviceName);
  if (!device) {
    res.json({ status: "error" });
    return;
  }
  channelManager.addChannel({name,device,port});
  res.json({ status: "ok" });
});

router.post("/remove", (req, res) => {
  const { name } = req.body;
  if (name) {
    channelManager.removeChannel(name);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});

router.post("/:name/setMaxLevel", (req, res) => {
  const { name } = req.params;
  const { maxLevel } = req.body;
  const channel = channelManager.getChannel(name);
  if (channel) {
    channel.setMaxLevel(maxLevel);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
}
);

router.post("/:name/setPort", (req, res) => {
  const { name } = req.params;
  const { port } = req.body;
  const channel = channelManager.getChannel(name);
  if (channel) {
    channel.setPort(port);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
}
);

router.post("/:name/setDevice", (req, res) => {
  const { name } = req.params;
  const { device:deviceName } = req.body;
  const channel = channelManager.getChannel(name);
  const device=this.deviceManager.getDevice(deviceName);
  if (channel) {
    channel.setDevice(device);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
}
);

module.exports = router;
  


