const { LocalStorage } = require("node-localstorage");
const EventEmitter = require("events");

// Constants
const TIMER_STATES = {
  STOPPED: "stopped",
  STARTED: "started",
};

const DAY_PERIODS = {
  NIGHT: "night",
  SUNRISE: "sunrise",
  SUNSET: "sunset",
  DAY: "day",
};

const CONSTANTS = {
  DEFAULT_STEPS: 8,
  DEFAULT_STEP_TIME: 10,
  DEFAULT_SUNRISE_TIME: 0,
  DEFAULT_SUNSET_TIME: 1440,
  TIMER_INTERVAL: 10000,
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
  MINUTES_IN_DAY: 1440,
};

class Timer extends EventEmitter {
  #state;
  #localStorage;

  constructor(name) {
    super();
    if (!name) throw new Error("Timer name is required");

    this.name = name;
    this.#state = TIMER_STATES.STOPPED;
    this.steps = CONSTANTS.DEFAULT_STEPS;
    this.stepTime = CONSTANTS.DEFAULT_STEP_TIME;
    this.channels = new Set(); // Используем Set для уникальных каналов
    this.sunriseTime = null;
    this.sunsetTime = null;
    this.timer = null;

    this.#initializeStorage();
  }

  #initializeStorage() {
    try {
      this.#localStorage = new LocalStorage(`./storage/${this.name}`);
    } catch (error) {
      this.emit("error", `Storage initialization failed: ${error.message}`);
      throw error;
    }
  }

  #loadFromStorage(key, defaultValue) {
    try {
      const value = this.#localStorage.getItem(key);
      return value ? parseInt(value) : defaultValue;
    } catch (error) {
      this.emit("error", `Failed to load ${key}: ${error.message}`);
      return defaultValue;
    }
  }

  #saveToStorage(key, value) {
    try {
      this.#localStorage.setItem(key, value);
    } catch (error) {
      this.emit("error", `Failed to save ${key}: ${error.message}`);
    }
  }

  init() {
    try {
      this.steps = this.#loadFromStorage("steps", CONSTANTS.DEFAULT_STEPS);
      this.stepTime = this.#loadFromStorage(
        "stepTime",
        CONSTANTS.DEFAULT_STEP_TIME
      );
      this.sunriseTime = this.#loadFromStorage(
        "sunriseTime",
        CONSTANTS.DEFAULT_SUNRISE_TIME
      );
      this.sunsetTime = this.#loadFromStorage(
        "sunsetTime",
        CONSTANTS.DEFAULT_SUNSET_TIME
      );
      this.#state = this.#localStorage.getItem("state") || TIMER_STATES.STOPPED;

      if (this.#state === TIMER_STATES.STARTED) {
        this.start();
      }
    } catch (error) {
      this.emit("error", `Timer initialization failed: ${error.message}`);
    }
  }

  // Оптимизированные методы расчета состояния
  #calculateDayPeriod(currentTime) {
    const { sunriseTime, sunsetTime } = this;
    const isNormalMode = sunriseTime < sunsetTime;

    if (this.#isNightTime(currentTime, isNormalMode)) return DAY_PERIODS.NIGHT;
    if (this.#isTransitionTime(currentTime, sunriseTime, true))
      return DAY_PERIODS.SUNRISE;
    if (this.#isTransitionTime(currentTime, sunsetTime, false))
      return DAY_PERIODS.SUNSET;
    return DAY_PERIODS.DAY;
  }

  #isNightTime(currentTime, isNormalMode) {
    // Обычный режим: sunrise < sunset (например, 6:00 < 22:00)
    // День: между sunrise и sunset (6:00 - 22:00)
    // Ночь: до sunrise или после sunset
    
    // Инвертированный режим: sunrise > sunset (например, 15:00 > 3:00)
    // День: от sunrise до конца дня + от начала дня до sunset (15:00 - 00:00 и 00:00 - 3:00)
    // Ночь: между sunset и sunrise (3:00 - 15:00)
    
    if (isNormalMode) {
      // Обычный режим
      return currentTime < this.sunriseTime || currentTime > this.sunsetTime;
    } else {
      // Инвертированный режим
      // Ночь = между sunset и sunrise
      return currentTime >= this.sunsetTime && currentTime < this.sunriseTime;
    }
  }
  getChannels() {
    return Array.from(this.channels).map((channel) => channel.name) || []; // Возвращаем массив имен каналов
  }

  #isTransitionTime(currentTime, timePoint, isRising) {
    const transitionPeriod = this.steps * this.stepTime;
    return isRising
      ? currentTime >= timePoint && currentTime < timePoint + transitionPeriod
      : currentTime <= timePoint && currentTime > timePoint - transitionPeriod;
  }

  // Публичные методы с улучшенной валидацией
  setSteps(steps) {
    if (!Number.isInteger(steps) || steps <= 0) {
      throw new Error("Steps must be a positive integer");
    }
    this.steps = steps;
    this.#saveToStorage("steps", steps);
    this.emit("stepsChanged", steps);
  }

  setStepTime(time) {
    if (!Number.isInteger(time) || time <= 0) {
      throw new Error("Step time must be a positive integer");
    }
    this.stepTime = time;
    this.#saveToStorage("stepTime", time);
    this.emit("stepTimeChanged", time);
  }

  setSunriseTime(minutes) {
    if (
      !Number.isInteger(minutes) ||
      minutes < 0 ||
      minutes >= CONSTANTS.MINUTES_IN_DAY
    ) {
      throw new Error("Sunrise time must be between 0 and 1439 minutes");
    }
    this.sunriseTime = minutes;
    this.#saveToStorage("sunriseTime", minutes);
    this.emit("sunriseTimeChanged", minutes);
  }

  setSunsetTime(minutes) {
    if (
      !Number.isInteger(minutes) ||
      minutes < 0 ||
      minutes >= CONSTANTS.MINUTES_IN_DAY
    ) {
      throw new Error("Sunset time must be between 0 and 1439 minutes");
    }
    this.sunsetTime = minutes;
    this.#saveToStorage("sunsetTime", minutes);
    this.emit("sunsetTimeChanged", minutes);
  }

  addChannel(channel) {
    this.channels.add(channel);
    this.emit("channelAdded", channel);
  }

  removeChannel(channel) {
    this.channels.delete(channel);
    this.emit("channelRemoved", channel);
  }

  #calculateBrightness(currentTime, period) {
    switch (period) {
      case DAY_PERIODS.NIGHT:
        return 0;

      case DAY_PERIODS.DAY:
        return CONSTANTS.MAX_PERCENTAGE;

      case DAY_PERIODS.SUNRISE: {
        const progress =
          (currentTime - this.sunriseTime) / (this.steps * this.stepTime);
        return Math.min(
          CONSTANTS.MAX_PERCENTAGE,
          CONSTANTS.MIN_PERCENTAGE +
            (CONSTANTS.MAX_PERCENTAGE - CONSTANTS.MIN_PERCENTAGE) * progress
        );
      }

      case DAY_PERIODS.SUNSET: {
        const progress =
          (this.sunsetTime - currentTime) / (this.steps * this.stepTime);
        return Math.max(
          CONSTANTS.MIN_PERCENTAGE,
          CONSTANTS.MIN_PERCENTAGE +
            (CONSTANTS.MAX_PERCENTAGE - CONSTANTS.MIN_PERCENTAGE) * progress
        );
      }
    }
  }

  #updateState() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const period = this.#calculateDayPeriod(currentMinutes);
    const brightness = this.#calculateBrightness(currentMinutes, period);
    
    this.emit("stateUpdate", {
      period,
      brightness,
      currentTime: currentMinutes,
      channels: Array.from(this.channels),
    });
  }

  json() {
    const channels = this.getChannels();
    return {
      name: this.name,
      state: this.state,
      steps: this.steps,
      stepTime: this.stepTime,
      sunriseTime: this.sunriseTime,
      sunsetTime: this.sunsetTime,
      channels,
    };
  }

  start() {
    if (this.#state === TIMER_STATES.STARTED) {
      console.log(`[Timer:${this.name}] Already started, skipping`);
      return;
    }

    console.log(`[Timer:${this.name}] Starting timer with interval ${CONSTANTS.TIMER_INTERVAL}ms`);
    
    this.timer = setInterval(() => {
      try {
        this.#updateState();
      } catch (error) {
        console.error(`[Timer:${this.name}] Error in updateState:`, error);
        this.emit("error", error);
      }
    }, CONSTANTS.TIMER_INTERVAL);

    this.#state = TIMER_STATES.STARTED;
    this.#saveToStorage("state", this.#state);
    
    console.log(`[Timer:${this.name}] Timer started successfully`);
    this.emit("started");
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.#state = TIMER_STATES.STOPPED;
    this.#saveToStorage("state", this.#state);
    this.emit("stopped");
  }

  // Геттеры для доступа к защищенным свойствам
  get state() {
    return this.#state;
  }
}

module.exports = { Timer, TIMER_STATES, DAY_PERIODS, CONSTANTS };
