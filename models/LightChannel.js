const LocalStorage = require("node-localstorage").LocalStorage;

class LightChannel {
  constructor(name, device, port) {
    this.name = name;
    this.device = device;
    this.port = port;
    this.maxLevel = 0;
    this.level = 0;
    this.manual = true;
    //this.nightMode=true;
    const storagePath = process.env.STORAGE_CHANNELS || "./storage/channels";
    this.localStorage = new LocalStorage(storagePath + "/" + name);
  }
  init() {
    this.maxLevel = parseInt(this.localStorage.getItem("maxLevel")) || 0;
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
      console.error(e);
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
      console.error(e);
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
      
      console.log(`MaxLevel changed from ${oldMaxLevel} to ${this.maxLevel} for channel ${this.name}`);
      
      // Пересчитываем и обновляем уровень на устройстве
      if (this.currentPercentage !== undefined) {
        await this.setPersentage(this.currentPercentage);
      } else if (this.manual) {
        await this.setPersentage(100);
      }
      return { status: "ok" };
    } catch (e) {
      console.error(e);
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
        console.warn(`[WARNING] Channel ${this.name} has maxLevel=0! Cannot calculate brightness.`);
        return { status: "error", message: "maxLevel is 0, cannot set brightness" };
      }
      
      // Сохраняем текущий процент для пересчета при изменении maxLevel
      this.currentPercentage = persentage;
      
      const newLevel =
        persentage === 0 ? 0 : Math.floor((this.maxLevel * persentage) / 100);
      
      // Всегда обновляем устройство, даже если level не изменился
      // (реальное состояние устройства могло быть изменено извне)
      // Округляем level до целого числа
      this.level = Math.round(newLevel);
      
      const res = await this.device.updatePort(this.port, this.level);
      
      return { status: "ok" };
    } catch (e) {
      console.error(`Channel ${this.name} setPersentage error:`, e);
      return { status: "error", message: e.message };
    }
  }

  json() {
    return {
      name: this.name,
      device: this.device?.name || "",
      port: this.port,
      maxLevel: this.maxLevel,
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
      console.error(e);
      return { status: "error", message: e.message };
    }
  }
}

module.exports = LightChannel;
