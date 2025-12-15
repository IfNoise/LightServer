const LocalStorage = require("node-localstorage").LocalStorage;
const LightChannel = require("./LightChannel");

class ChannelsManager {
  static instance = null;
  constructor(deviceManager) {
    this.channels = [];
    this.localStorage = new LocalStorage(process.env.STORAGE_CHANNELS || "./storage/channels");
    this.deviceManager = deviceManager;
  }

  static getInstance(deviceManager) {
    if (!ChannelsManager.instance) {
      ChannelsManager.instance = new ChannelsManager(deviceManager);
    }
    return ChannelsManager.instance;
  }

  loadChannels() {
    const channels = JSON.parse(this.localStorage.getItem("channels"));
    if (channels?.length > 0) {
      this.channels = [];
      channels.forEach((channel) => {
        this.addChannel({
          name: channel.name,
          device: channel.device,
          port: channel.port,
        });
      });
    }
  }

  saveChannels() {
    const out = this.channels.map((channel) => {
      return channel.json();
    });
    this.localStorage.setItem("channels", JSON.stringify(out));
  }

  init() {
    if (JSON.parse(this.localStorage.getItem("channels"))?.length > 0) {
      this.loadChannels();
    }
  }
  addChannel(channel) {
    try {
      const { name, device: deviceName, port } = channel;
      if (this.channels.find((c) => c.name === name)) {
        throw new Error("Channel already exists");
      }
      if (
        deviceName === undefined ||
        deviceName === "" ||
        port === undefined ||
        port === ""
      ) {
        throw new Error("Invalid parameters");
      }
      if (!this.deviceManager.getDevice(deviceName)) {
        throw new Error("Device not found");
      }
      const device = this.deviceManager.getDevice(deviceName);
      const newChannel = new LightChannel(name, device, port);
      newChannel.init();
      this.channels.push(newChannel);
      this.saveChannels();
      return { status: "ok" };
    } catch (e) {
      console.log(e);
      return { status: "error", message: e.message };
    }
  }

  removeChannel(name) {
    try {
      if (!this.channels.find((c) => c.name === name)) {
        throw new Error("Channel not found");
      }
      this.channels = this.channels.filter((c) => c.name !== name);
      this.saveChannels();
      return { status: "ok" };
    } catch (e) {
      console.log(e);
      return { status: "error", message: e.message };
    }
  }

  getChannels() {
    try {
      if (this.channels.length === 0) {
        throw new Error("No channels found");
      }
      return this.channels;
    } catch (e) {
      console.log(e);
      return { status: "error", message: e.message };
    }
  }
  getChannelsJSON() {
    if (this.channels.length === 0) {
      return { status: "error", message: "No channels found" };
    }
    return this.channels.map((channel) => {
      return channel.json();
    });
  }
  getChannel(name) {
    return this.channels.find((c) => c.name === name) || null;
  }

  async getChannelState(name) {
    const channel = this.channels.find((c) => c.name === name);

    if (channel) {
      return channel.getState();
    } else {
      return { status: "error" };
    }
  }

  async getChannelsState() {
    const state = await Promise.all(
      this.channels.map(async (channel) => {
        const state = await channel.getState();
        return { name: channel.name, state };
      })
    );
    return state;
  }
}

module.exports = ChannelsManager;
