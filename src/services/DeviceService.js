import DeviceManager from '../models/DeviceManager.js';

/**
 * Service for managing devices business logic
 */
class DeviceService {
  constructor() {
    this.deviceManager = DeviceManager.getInstance();
  }

  /**
   * Get all devices
   * @returns {Array} List of all devices
   */
  getAllDevices() {
    return this.deviceManager.getDevices();
  }

  /**
   * Get device by name
   * @param {string} name - Device name
   * @returns {Object|null} Device object or null if not found
   */
  getDeviceByName(name) {
    return this.deviceManager.getDevice(name);
  }

  /**
   * Create a new device
   * @param {string} name - Device name
   * @param {Object} deviceData - Device configuration data
   * @returns {Object} Result with status and device info
   */
  createDevice(name, deviceData) {
    const { type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount } = deviceData;
    
    let options = {};
    
    if (type === "rtu") {
      options = {
        type: "rtu",
        path: path,
        baudRate: baudRate || 9600,
        dataBits: dataBits || 8,
        stopBits: stopBits || 1,
        parity: parity || "none",
        unitId: unitId || 1,
        timeout: timeout || 1000,
        portsCount: portsCount || 8
      };
    } else {
      options = {
        type: "tcp",
        host: address,
        port: port || "502",
        timeout: timeout || 1000,
        portsCount: portsCount || 8
      };
    }
    
    this.deviceManager.addDevice(name, options);
    return { status: "ok", device: { name, type: options.type } };
  }

  /**
   * Update device partially
   * @param {string} name - Device name
   * @param {Object} updateData - Data to update
   * @returns {Object} Result with status
   */
  updateDevice(name, updateData) {
    const device = this.deviceManager.getDevice(name);
    if (!device) {
      return { status: "error", message: "Device not found" };
    }
    
    const { timeout, port, path, baudRate, dataBits, stopBits, parity, unitId, host } = updateData;
    
    if (timeout !== undefined) device.options.timeout = timeout;
    if (port !== undefined && device.type === "tcp") device.options.port = port;
    if (host !== undefined && device.type === "tcp") device.options.host = host;
    if (path !== undefined && device.type === "rtu") device.options.path = path;
    if (baudRate !== undefined && device.type === "rtu") device.options.baudRate = baudRate;
    if (dataBits !== undefined && device.type === "rtu") device.options.dataBits = dataBits;
    if (stopBits !== undefined && device.type === "rtu") device.options.stopBits = stopBits;
    if (parity !== undefined && device.type === "rtu") device.options.parity = parity;
    if (unitId !== undefined && device.type === "rtu") device.unitId = unitId;
    
    this.deviceManager.saveDevices();
    return { status: "ok" };
  }

  /**
   * Replace device completely
   * @param {string} name - Device name
   * @param {Object} deviceData - New device data
   * @returns {Object} Result with status and device info
   */
  replaceDevice(name, deviceData) {
    const device = this.deviceManager.getDevice(name);
    if (!device) {
      return { status: "error", message: "Device not found" };
    }
    
    const { type, address, port, path, baudRate, dataBits, stopBits, parity, unitId, timeout, portsCount } = deviceData;
    
    let options = {};
    
    if (type === "rtu") {
      options = {
        type: "rtu",
        path: path,
        baudRate: baudRate || 9600,
        dataBits: dataBits || 8,
        stopBits: stopBits || 1,
        parity: parity || "none",
        unitId: unitId || 1,
        timeout: timeout || 1000,
        portsCount: portsCount || 8
      };
    } else {
      options = {
        type: "tcp",
        host: address,
        port: port || "502",
        timeout: timeout || 1000,
        portsCount: portsCount || 8
      };
    }
    
    this.deviceManager.removeDevice(device);
    this.deviceManager.addDevice(name, options);
    return { status: "ok", device: { name, type: options.type } };
  }

  /**
   * Delete device
   * @param {string} name - Device name
   * @returns {Object} Result with status
   */
  deleteDevice(name) {
    const device = this.deviceManager.getDevice(name);
    if (!device) {
      return { status: "error", message: "Device not found" };
    }
    
    this.deviceManager.removeDevice(device);
    return { status: "ok" };
  }

  /**
   * Get device state
   * @param {string} name - Device name
   * @returns {Promise<Object>} Device state
   */
  async getDeviceState(name) {
    const device = this.deviceManager.getDevice(name);
    if (!device) {
      return { status: "error", message: "Device not found" };
    }
    
    const state = await device.requestState();
    return { state };
  }
}

export default DeviceService;
