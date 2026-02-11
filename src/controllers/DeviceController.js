import DeviceService from '../services/DeviceService.js';

const deviceService = new DeviceService();

/**
 * Controller for handling device-related HTTP requests
 */
class DeviceController {
  /**
   * Get all devices
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getAllDevices(req, res) {
    try {
      const devices = deviceService.getAllDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Get single device
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getDevice(req, res) {
    try {
      const { name } = req.params;
      const device = deviceService.getDeviceByName(name);
      
      if (device) {
        res.json(device.json());
      } else {
        res.status(404).json({ status: "error", message: "Device not found" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Create new device
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static createDevice(req, res) {
    try {
      const { name, type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ status: "error", message: "Device name is required" });
      }
      
      if (type === "rtu") {
        if (!path) {
          return res.status(400).json({ status: "error", message: "Serial port path is required for RTU devices" });
        }
      } else {
        if (!address) {
          return res.status(400).json({ status: "error", message: "IP address is required for TCP devices" });
        }
      }
      
      const result = deviceService.createDevice(name, { type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Update device (partial)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static updateDevice(req, res) {
    try {
      const { name } = req.params;
      const result = deviceService.updateDevice(name, req.body);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Replace device (full update)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static replaceDevice(req, res) {
    try {
      const { name } = req.params;
      const { type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount } = req.body;
      
      // Validate required fields based on device type
      if (type === "rtu") {
        if (!path) {
          return res.status(400).json({ status: "error", message: "Serial port path is required for RTU devices" });
        }
      } else {
        if (!address) {
          return res.status(400).json({ status: "error", message: "IP address is required for TCP devices" });
        }
      }
      
      const result = deviceService.replaceDevice(name, { type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount });
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Delete device
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static deleteDevice(req, res) {
    try {
      const { name } = req.params;
      const result = deviceService.deleteDevice(name);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Get device state
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async getDeviceState(req, res) {
    try {
      const { name } = req.params;
      const result = await deviceService.getDeviceState(name);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}

export default DeviceController;
