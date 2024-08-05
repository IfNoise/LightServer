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
  const { name, device, port } = req.body;
  channelManager.addChannel({name,device,port});
  res.json({ status: "ok" });
});

router.post("/remove", (req, res) => {
  const { name } = req.body;
  const channel = channelManager.getChannel(name);
  if (channel) {
    channelManager.removeChannel(channel);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});

router.post("/setMaxLevel", (req, res) => {
  const { name, maxLevel } = req.body;
  const channel = channelManager.getChannel(name);
  if (channel) {
    channel.setMaxLevel(maxLevel);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
}
);

router.post("/setPort", (req, res) => {
  const { name, port } = req.body;
  const channel = channelManager.getChannel(name);
  if (channel) {
    channel.setPort(port);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
}
);

router.post("/setDevice", (req, res) => {
  const { name, device } = req.body;
  const channel = channelManager.getChannel(name);
  if (channel) {
    channel.setDevice(device);
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
}
);

module.exports = router;
  

