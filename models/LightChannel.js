const c = require("config");

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
    this.localStorage = new LocalStorage("./storage/channels/" + name);
  }
  init() {
    this.maxLevel = parseInt(this.localStorage.getItem("maxLevel")) || 0;
  }
  setDevice(device) {
    try {
      if (this.device) {
        if (this.device.name == device.name) {
          return;
        }
      }
      this.device = device;
    } catch (e) {
      console.log(e.message);
      return;
    }
  }
  setPort(port) {
    try {
      if (Number.isNaN(port)) {
        throw new Error("Port must be a number");
      }
      this.port = port;
      this.localStorage.setItem("port", port);
    } catch (e) {
      console.log(e.message);
      return;
    }
  }
  setMaxLevel(maxLevel) {
    try {
      if (Number.isNaN(maxLevel)) {
        throw new Error("Max level must be a number");
      }
      this.maxLevel = maxLevel;
      if (this.manual) {
        this.setPersentage(100);
      }

      this.localStorage.setItem("maxLevel", this.maxLevel);
    } catch (e) {
      console.log(e.message);
      return;
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
      const newLevel =
        persentage === 0 ? 0 : Math.floor((this.maxLevel * persentage) / 100);
      if (newLevel == this.level) {
        return;
      }
      this.level = newLevel;
      console.log("Timer", this.name, "set level", this.level);
      const res = await this.device.updatePort(this.port, this.level);
      if (res) {
        console.log(
          "Port",
          this.port,
          "set to",
          this.level,
          Math.floor((this.level / 32767) * 100),
          "%"
        );
        console.log("res", res);
      }
    } catch (e) {
      console.log(e.message);
      return;
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
      if (this.device) {
        const ports = await this.device.requestState();
        return ports[this.port];
      } else {
        throw new Error("Device not set");
      }
    } catch (e) {
      console.log(e.message);
      return;
    }
  }
}

module.exports = LightChannel;
