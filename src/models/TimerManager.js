import { Timer, TIMER_STATES } from "./Timer.js";
import { LocalStorage } from "node-localstorage";
import logger from "../config/logger.js";

const removeElement = (array, element) => {
  let index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
  }
};
class TimerManager {
  static instance = null;
  constructor(channelManager) {
    if (TimerManager.instance) {
      return TimerManager.instance;
    }
    TimerManager.instance = this;
    this.timers = [];
    this.channelManager = channelManager;
    this.localStorage = new LocalStorage(process.env.STORAGE_TIMERS || "./storage/timers");
  }
  static getInstance(channelManager) {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager(channelManager);
    }
    return TimerManager.instance;
  }

  init() {
    this.loadTimers();
  }

  loadTimers() {
    try {
      const timers = JSON.parse(this.localStorage.getItem("timers")) ?? [];
      this.timers = timers.map((timer) => {
        const newTimer = new Timer(timer.name);
        newTimer.setSteps(timer.steps);
        newTimer.setStepTime(timer.stepTime);
        newTimer.setSunriseTime(timer.sunriseTime);
        newTimer.setSunsetTime(timer.sunsetTime);

        // Подписываемся на события таймера
        newTimer.on("stateUpdate", async ({ brightness, channels }) => {
          await Promise.all(
            channels.map(async (channel) => {
              return await channel.setPersentage(brightness);
            })
          );
        });

        newTimer.on("error", (error) => {
          logger.error(`Timer error`, { timer: timer.name, error: error.message });
        });

        if (timer.state === TIMER_STATES.STARTED) {
          newTimer.start();
        }
        return newTimer;
      });

      // Подписываем каналы после создания всех таймеров
      timers.forEach((timerData) => {
        if (timerData.channels && timerData.channels.length > 0) {
          this.subscribe(timerData.name, timerData.channels);
        }
      });
    } catch (e) {
      logger.error("Error loading timers", { error: e.message });
    }
  }

  saveTimers() {
    const output = this.timers.map((timer) => ({
      name: timer.name,
      steps: timer.steps,
      stepTime: timer.stepTime,
      sunriseTime: timer.sunriseTime,
      sunsetTime: timer.sunsetTime,
      state: timer.state,
      channels: Array.from(timer.channels).map((ch) => ch.name),
    }));
    this.localStorage.setItem("timers", JSON.stringify(output));
  }

  addTimer(name, steps, stepTime, sunriseTime, sunsetTime) {
    try {
      if (name === undefined || name === "") {
        throw new Error("Invalid parameters");
      }
      if (this.timers.find((t) => t.name === name)) {
        throw new Error("Timer already exists");
      }
      if (
        steps === undefined ||
        steps === "" ||
        stepTime === undefined ||
        stepTime === "" ||
        sunriseTime === undefined ||
        sunriseTime === "" ||
        sunsetTime === undefined ||
        sunsetTime === ""
      ) {
        throw new Error("Invalid parameters");
      }
      const timer = new Timer(name);
      timer.setSteps(steps);
      timer.setStepTime(stepTime);
      timer.setSunriseTime(sunriseTime);
      timer.setSunsetTime(sunsetTime);
      
      // Подписываемся на события таймера
      timer.on("stateUpdate", async ({ brightness, channels }) => {
        logger.debug(`Timer state update`, { timer: name, brightness, channelsCount: channels.length });
        const results = await Promise.all(
          channels.map(async (channel) => {
            const result = await channel.setPersentage(brightness);
            logger.debug(`Channel updated`, { timer: name, channel: channel.name, result });
            return result;
          })
        );
        logger.debug(`Timer update completed`, { timer: name });
      });

      timer.on("error", (error) => {
        logger.error(`Timer error`, { timer: name, error: error.message });
      });
      
      timer.init();
      this.timers.push(timer);
      this.saveTimers();
      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to add timer", { error: e.message });
      return { status: "error", message: e.message };
    }
  }

  removeTimer(timerName) {
    try {
      const timer = this.timers.find((t) => t.name === timerName);
      if (!timer) throw new Error("Timer not found");

      // Освобождаем все каналы
      Array.from(timer.channels).forEach((channel) => {
        channel.manual = true;
      });

      timer.stop();
      this.timers = this.timers.filter((t) => t.name !== timerName);
      this.saveTimers();
      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to remove timer", { timer: timerName, error: e.message });
      return { status: "error", message: e.message };
    }
  }
  getTimer(name) {
    return this.timers.find((t) => t.name === name);
  }
  getTimers() {
    return this.timers.map((t) => t.json());
  }
  subscribe(timerName, channelNames) {
    try {
      const timer = this.timers.find((t) => t.name === timerName);
      if (!timer) throw new Error("Timer not found");

      channelNames.forEach((channelName) => {
        const channel = this.channelManager.getChannel(channelName);
        if (!channel) {
          throw new Error(`Channel ${channelName} not found`);
        }
        if (!channel.manual) {
          throw new Error(`Channel ${channelName} is already subscribed`);
        }
        channel.manual = false;
        timer.addChannel(channel);
      });

      this.saveTimers();
      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to subscribe channels to timer", { timer: timerName, error: e.message });
      return { status: "error", message: e.message };
    }
  }

  unsubscribe(timerName, channelNames) {
    try {
      const timer = this.timers.find((t) => t.name === timerName);
      if (!timer) throw new Error("Timer not found");

      channelNames.forEach((channelName) => {
        const channel = this.channelManager.getChannel(channelName);
        if (!channel) {
          throw new Error(`Channel ${channelName} not found`);
        }
        if (channel.manual) {
          throw new Error(`Channel ${channelName} is not subscribed`);
        }
        channel.manual = true;
        timer.removeChannel(channel);
      });

      this.saveTimers();
      return { status: "ok" };
    } catch (e) {
      logger.error("Failed to unsubscribe channels from timer", { timer: timerName, error: e.message });
      return { status: "error", message: e.message };
    }
  }
}

export default TimerManager;
