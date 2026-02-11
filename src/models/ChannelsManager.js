import { LocalStorage } from "node-localstorage";
import { EventEmitter } from "events";
import LightChannel from "./LightChannel.js";
import logger from "../config/logger.js";

class ChannelsManager extends EventEmitter {
  static instance = null;
  constructor(deviceManager) {
    super();
    this.channels = [];
    this.localStorage = new LocalStorage(
      process.env.STORAGE_CHANNELS || "./storage/channels",
    );
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
      this.loadChannelsWithEvents();
    }
  }
  addChannel(channel) {
    try {
      const { name, device: deviceName, port } = channel;
      if (!name) {
        throw new Error("Channel name is required");
      }
      if (this.channels.find((c) => c.name === name)) {
        throw new Error("Channel already exists");
      }
      if (deviceName === undefined || deviceName === "") {
        throw new Error("Device name is required");
      }
      if (port === undefined || port === null) {
        throw new Error("Port is required");
      }
      if (!this.deviceManager.getDevice(deviceName)) {
        throw new Error("Device not found");
      }
      const device = this.deviceManager.getDevice(deviceName);
      const newChannel = new LightChannel(name, device, port);
      newChannel.init();

      // Подписываемся на события канала
      this.subscribeToChannelEvents(newChannel);

      this.channels.push(newChannel);
      this.saveChannels();

      // Эмитим событие добавления канала
      this.emit("channel:added", newChannel.json());

      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to add channel", {
        channel: channel.name,
        error: e.message,
      });
      return { status: "error", message: e.message };
    }
  }

  removeChannel(name) {
    try {
      const channel = this.channels.find((c) => c.name === name);
      if (!channel) {
        throw new Error("Channel not found");
      }

      // Отписываемся от событий канала
      channel.removeAllListeners();

      this.channels = this.channels.filter((c) => c.name !== name);
      this.saveChannels();

      // Эмитим событие удаления канала
      this.emit("channel:removed", name);

      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to remove channel", {
        channel: name,
        error: e.message,
      });
      return { status: "error", message: e.message };
    }
  }

  getChannels() {
    return this.channels;
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
      }),
    );
    return state;
  }

  /**
   * Подписка на события канала
   * @param {LightChannel} channel - Канал для подписки
   */
  subscribeToChannelEvents(channel) {
    channel.on("state:changed", (state) => {
      this.emit("channel:updated", { name: channel.name, state });
    });
  }

  /**
   * Загрузка каналов с подпиской на события
   */
  loadChannelsWithEvents() {
    this.loadChannels();
    // Подписываемся на события всех загруженных каналов
    this.channels.forEach((channel) => {
      this.subscribeToChannelEvents(channel);
    });
  }
}

export default ChannelsManager;
