import TimerManager from '../models/TimerManager.js';
import ChannelsManager from '../models/ChannelsManager.js';
import logger from '../config/logger.js';

/**
 * Service for managing timers business logic
 */
class TimerService {
  constructor() {
    this.channelManager = ChannelsManager.getInstance();
    this.timerManager = TimerManager.getInstance(this.channelManager);
  }

  /**
   * Get all timers
   * @returns {Array} List of all timers
   */
  getAllTimers() {
    return this.timerManager.getTimers();
  }

  /**
   * Get timer by name
   * @param {string} name - Timer name
   * @returns {Object|null} Timer object or null if not found
   */
  getTimerByName(name) {
    return this.timerManager.getTimer(name);
  }

  /**
   * Create a new timer
   * @param {string} name - Timer name
   * @param {Array} steps - Timer steps
   * @param {number} stepTime - Step time in minutes
   * @param {string} sunriseTime - Sunrise time
   * @param {string} sunsetTime - Sunset time
   * @returns {Object} Result with status
   */
  createTimer(name, steps, stepTime, sunriseTime, sunsetTime) {
    return this.timerManager.addTimer(name, steps, stepTime, sunriseTime, sunsetTime);
  }

  /**
   * Update timer partially
   * @param {string} name - Timer name
   * @param {Object} updateData - Data to update
   * @returns {Object} Result with status
   */
  updateTimer(name, updateData) {
    const timer = this.timerManager.getTimer(name);
    if (!timer) {
      return { status: "error", message: "Timer not found" };
    }
    
    const { steps, stepTime, sunriseTime, sunsetTime } = updateData;
    
    if (steps !== undefined) timer.setSteps(steps);
    if (stepTime !== undefined) timer.setStepTime(stepTime);
    if (sunriseTime !== undefined) timer.setSunriseTime(sunriseTime);
    if (sunsetTime !== undefined) timer.setSunsetTime(sunsetTime);
    
    this.timerManager.saveTimers();
    return { status: "ok" };
  }

  /**
   * Replace timer completely
   * @param {string} name - Timer name
   * @param {Object} timerData - New timer data
   * @returns {Object} Result with status
   */
  replaceTimer(name, timerData) {
    const timer = this.timerManager.getTimer(name);
    if (!timer) {
      return { status: "error", message: "Timer not found" };
    }
    
    const { steps, stepTime, sunriseTime, sunsetTime } = timerData;
    
    // Remove and recreate timer
    this.timerManager.removeTimer(name);
    return this.timerManager.addTimer(name, steps, stepTime, sunriseTime, sunsetTime);
  }

  /**
   * Delete timer
   * @param {string} name - Timer name
   * @returns {Object} Result with status
   */
  deleteTimer(name) {
    return this.timerManager.removeTimer(name);
  }

  /**
   * Subscribe channels to timer
   * @param {string} name - Timer name
   * @param {Array} channels - Channel names to subscribe
   * @returns {Object} Result with status
   */
  subscribeChannels(name, channels) {
    return this.timerManager.subscribe(name, channels);
  }

  /**
   * Unsubscribe channels from timer
   * @param {string} name - Timer name
   * @param {Array} channels - Channel names to unsubscribe
   * @returns {Object} Result with status
   */
  unsubscribeChannels(name, channels) {
    return this.timerManager.unsubscribe(name, channels);
  }

  /**
   * Start timer
   * @param {string} name - Timer name
   * @returns {Object} Result with status
   */
  startTimer(name) {
    const timer = this.timerManager.getTimer(name);
    if (!timer) {
      return { status: "error", message: "Timer not found" };
    }
    
    timer.start();
    return { status: "ok" };
  }

  /**
   * Stop timer
   * @param {string} name - Timer name
   * @returns {Object} Result with status
   */
  stopTimer(name) {
    const timer = this.timerManager.getTimer(name);
    if (!timer) {
      return { status: "error", message: "Timer not found" };
    }
    
    timer.stop();
    return { status: "ok" };
  }

  /**
   * Set timer steps
   * @param {string} name - Timer name
   * @param {Array} steps - New steps
   * @returns {Object} Result with status
   */
  setTimerSteps(name, steps) {
    const timer = this.timerManager.getTimer(name);
    if (!timer) {
      return { status: "error", message: "Timer not found" };
    }
    
    timer.setSteps(steps);
    this.timerManager.saveTimers();
    return { status: "ok" };
  }

  /**
   * Set timer sunrise time
   * @param {string} name - Timer name
   * @param {string} time - Sunrise time
   * @returns {Object} Result with status
   */
  setTimerSunriseTime(name, time) {
    const timer = this.timerManager.getTimer(name);
    if (!timer) {
      return { status: "error", message: "Timer not found" };
    }
    
    timer.setSunriseTime(time);
    this.timerManager.saveTimers();
    return { status: "ok" };
  }

  /**
   * Set timer sunset time
   * @param {string} name - Timer name
   * @param {string} time - Sunset time
   * @returns {Object} Result with status
   */
  setTimerSunsetTime(name, time) {
    const timer = this.timerManager.getTimer(name);
    if (!timer) {
      return { status: "error", message: "Timer not found" };
    }
    
    timer.setSunsetTime(time);
    this.timerManager.saveTimers();
    return { status: "ok" };
  }

  /**
   * Set timer step time
   * @param {string} name - Timer name
   * @param {number} stepTime - Step time in minutes
   * @returns {Object} Result with status
   */
  setTimerStepTime(name, stepTime) {
    const timer = this.timerManager.getTimer(name);
    if (!timer) {
      return { status: "error", message: "Timer not found" };
    }
    
    timer.setStepTime(stepTime);
    this.timerManager.saveTimers();
    return { status: "ok" };
  }
}

export default TimerService;
