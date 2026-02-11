import { LocalStorage } from "node-localstorage";
import logger from "../config/logger.js";

class LightChannel {
  constructor(name, device, port) {
    this.name = name;
    this.device = device;
    this.port = port;
    this.maxLevel = 0;
    this.minLevel = 0; // Минимальный уровень регулирования (для нечувствительных светильников)
    this.level = 0;
    this.manual = true;
    //this.nightMode=true;
    const storagePath = process.env.STORAGE_CHANNELS || "./storage/channels";
    this.localStorage = new LocalStorage(storagePath + "/" + name);
  }
  init() {
    this.maxLevel = parseInt(this.localStorage.getItem("maxLevel")) || 0;
    this.minLevel = parseInt(this.localStorage.getItem("minLevel")) || 0;
    // currentPercentage остается undefined, пока не будет явно установлен
  }
  setDevice(device) {
    try {
      if (this.device) {
        if (this.device.name == device.name) {
          return { status: "ok", message: "Device already set" };
        }
      }
      this.device = device;
      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to set device for channel", { channel: this.name, error: e.message });
      return { status: "error", message: e.message };
    }
  }
  setPort(port) {
    try {
      if (Number.isNaN(port)) {
        throw new Error("Port must be a number");
      }
      this.port = port;
      this.localStorage.setItem("port", port);
      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to set port for channel", { channel: this.name, error: e.message });
      return { status: "error", message: e.message };
    }
  }
  async setMinLevel(minLevel) {
    try {
      if (Number.isNaN(minLevel)) {
        throw new Error("Min level must be a number");
      }
      if (minLevel < 0) {
        throw new Error("Min level must be non-negative");
      }
      if (minLevel > this.maxLevel) {
        throw new Error("Min level cannot be greater than max level");
      }
      const oldMinLevel = this.minLevel;
      // Округляем до целого числа для Modbus регистров
      this.minLevel = Math.round(minLevel);
      this.localStorage.setItem("minLevel", this.minLevel);
      
      logger.debug(`MinLevel changed for channel`, { channel: this.name, oldMinLevel, newMinLevel: this.minLevel });
      
      // Пересчитываем и обновляем уровень на устройстве
      if (this.currentPercentage !== undefined) {
        await this.setPersentage(this.currentPercentage);
      }
      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to set minLevel for channel", { channel: this.name, error: e.message });
      return { status: "error", message: e.message };
    }
  }
  async setMaxLevel(maxLevel) {
    try {
      if (Number.isNaN(maxLevel)) {
        throw new Error("Max level must be a number");
      }
      const oldMaxLevel = this.maxLevel;
      // Округляем до целого числа для Modbus регистров
      this.maxLevel = Math.round(maxLevel);
      this.localStorage.setItem("maxLevel", this.maxLevel);
      
      logger.debug(`MaxLevel changed for channel`, { channel: this.name, oldMaxLevel, newMaxLevel: this.maxLevel });
      
      // Пересчитываем и обновляем уровень на устройстве
      if (this.currentPercentage !== undefined) {
        await this.setPersentage(this.currentPercentage);
      } else if (this.manual) {
        await this.setPersentage(100);
      }
      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to set maxLevel for channel", { channel: this.name, error: e.message });
      return { status: "error", message: e.message };
    }
  }
  async setPersentage(persentage) {
    try {
      if (Number.isNaN(persentage)) {
        throw new Error("Persentage must be a number");
      }
      if (persentage < 0 || persentage > 100) {
        throw new Error("Persentage must be between 0 and 100");
      }
      
      if (!this.device) {
        throw new Error("Device not set");
      }
      
      if (this.maxLevel === 0) {
        logger.warn(`Channel has maxLevel=0, cannot calculate brightness`, { channel: this.name });
        return { status: "error", message: "maxLevel is 0, cannot set brightness" };
      }
      
      // Сохраняем текущий процент для пересчета при изменении maxLevel
      this.currentPercentage = persentage;
      
      let newLevel;
      if (persentage === 0) {
        // Полностью выключено
        newLevel = 0;
      } else {
        // Масштабируем от minLevel до maxLevel
        // При percentage=1 получим minLevel, при percentage=100 получим maxLevel
        newLevel = this.minLevel + ((this.maxLevel - this.minLevel) * persentage) / 100;
      }
      
      // Всегда обновляем устройство, даже если level не изменился
      // (реальное состояние устройства могло быть изменено извне)
      // Округляем level до целого числа
      this.level = Math.round(newLevel);
      
      const res = await this.device.updatePort(this.port, this.level);
      
      return { status: "ok" };
    } catch (e) {
      logger.error(`Channel setPersentage error`, { channel: this.name, error: e.message });
      return { status: "error", message: e.message };
    }
  }

  json() {
    return {
      name: this.name,
      device: this.device?.name || "",
      port: this.port,
      maxLevel: this.maxLevel,
      minLevel: this.minLevel,
      manual: this.manual,
    };
  }
  async getState() {
    try {
      if (!this.device) {
        throw new Error("Device not set");
      }
      const ports = await this.device.requestState();
      return ports[this.port];
    } catch (e) {
      logger.error("Failed to get channel state", { channel: this.name, error: e.message });
      return { status: "error", message: e.message };
    }
  }
}

export default LightChannel;
