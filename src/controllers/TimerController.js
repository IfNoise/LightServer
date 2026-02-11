import TimerService from '../services/TimerService.js';

const timerService = new TimerService();

/**
 * Controller for handling timer-related HTTP requests
 */
class TimerController {
  /**
   * Get all timers
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getAllTimers(req, res) {
    try {
      const timers = timerService.getAllTimers();
      res.json(timers);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Get single timer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getTimer(req, res) {
    try {
      const { name } = req.params;
      const timer = timerService.getTimerByName(name);
      
      if (timer) {
        res.json(timer.json());
      } else {
        res.status(404).json({ status: "error", message: "Timer not found" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Create new timer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static createTimer(req, res) {
    try {
      const { name, steps, stepTime, sunriseTime, sunsetTime } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ status: "error", message: "Timer name is required" });
      }
      
      const result = timerService.createTimer(name, steps, stepTime, sunriseTime, sunsetTime);
      
      if (result.status === "ok") {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Update timer (partial)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static updateTimer(req, res) {
    try {
      const { name } = req.params;
      const result = timerService.updateTimer(name, req.body);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Replace timer (full update)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static replaceTimer(req, res) {
    try {
      const { name } = req.params;
      const { steps, stepTime, sunriseTime, sunsetTime } = req.body;
      
      const result = timerService.replaceTimer(name, { steps, stepTime, sunriseTime, sunsetTime });
      
      if (result.status === "ok") {
        res.json(result);
      } else if (result.status === "error" && result.message === "Timer not found") {
        res.status(404).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Delete timer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static deleteTimer(req, res) {
    try {
      const { name } = req.params;
      const result = timerService.deleteTimer(name);
      
      if (result.status === "ok") {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Subscribe channels to timer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static subscribeChannels(req, res) {
    try {
      const { name } = req.params;
      const channels = req.body?.channels ? [...req.body.channels] : [];
      const result = timerService.subscribeChannels(name, channels);
      
      if (result.status === "ok") {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Unsubscribe channels from timer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static unsubscribeChannels(req, res) {
    try {
      const { name } = req.params;
      const channels = req.body?.channels ? [...req.body.channels] : [];
      const result = timerService.unsubscribeChannels(name, channels);
      
      if (result.status === "ok") {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Start timer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static startTimer(req, res) {
    try {
      const { name } = req.params;
      const result = timerService.startTimer(name);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Stop timer
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static stopTimer(req, res) {
    try {
      const { name } = req.params;
      const result = timerService.stopTimer(name);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Add timer (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static addTimer(req, res) {
    try {
      const { name, steps, stepTime, sunriseTime, sunsetTime } = req.body;
      const result = timerService.createTimer(name, steps, stepTime, sunriseTime, sunsetTime);
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Remove timer (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static removeTimer(req, res) {
    try {
      const { name } = req.body;
      const result = timerService.deleteTimer(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Set timer steps (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static setSteps(req, res) {
    try {
      const { name } = req.params;
      const { steps } = req.body;
      const result = timerService.setTimerSteps(name, steps);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Set timer sunrise time (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static setSunriseTime(req, res) {
    try {
      const { name } = req.params;
      const { time } = req.body;
      const result = timerService.setTimerSunriseTime(name, time);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Set timer sunset time (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static setSunsetTime(req, res) {
    try {
      const { name } = req.params;
      const { time } = req.body;
      const result = timerService.setTimerSunsetTime(name, time);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Set timer step time (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static setStepTime(req, res) {
    try {
      const { name } = req.params;
      const { stepTime } = req.body;
      const result = timerService.setTimerStepTime(name, stepTime);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}

export default TimerController;
