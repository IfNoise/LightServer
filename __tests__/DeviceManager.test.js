import DeviceManager from '../src/models/DeviceManager.js';
import ModbusDevice from '../src/models/ModbusDevice.js';
import { LocalStorage } from 'node-localstorage';

// Mock dependencies
jest.mock('node-localstorage');
jest.mock('../src/models/ModbusDevice');

describe('DeviceManager', () => {
  let deviceManager;
  let mockLocalStorage;

  beforeEach(() => {
    // Reset singleton
    DeviceManager.instance = null;
    
    // Setup mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    LocalStorage.mockImplementation(() => mockLocalStorage);

    // Setup mock ModbusDevice
    ModbusDevice.mockImplementation((name, address, port, timeout, type) => ({
      name,
      type,
      options: { host: address, port, timeout },
      portsCount: 8,
      unitId: 1,
      init: jest.fn(),
    }));

    deviceManager = DeviceManager.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = DeviceManager.getInstance();
      const instance2 = DeviceManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('init', () => {
    test('should call loadDevices', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      deviceManager.init();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('devices');
    });

    test('should load devices from storage', () => {
      const storedDevices = JSON.stringify([
        {
          name: 'Device1',
          options: {
            type: 'tcp',
            host: '192.168.1.100',
            port: '502',
            timeout: 1000,
            portsCount: 8
          }
        }
      ]);
      mockLocalStorage.getItem.mockReturnValue(storedDevices);
      
      deviceManager.init();
      
      expect(ModbusDevice).toHaveBeenCalledWith(
        'Device1',
        '192.168.1.100',
        '502',
        1000,
        'tcp',
        9600,
        8,
        1,
        'none',
        1,
        8
      );
    });
  });

  describe('addDevice', () => {
    test('should add TCP device', () => {
      const options = {
        type: 'tcp',
        host: '192.168.1.100',
        port: '502',
        timeout: 1000,
        portsCount: 8
      };

      deviceManager.addDevice('TCPDevice', options);

      expect(ModbusDevice).toHaveBeenCalledWith(
        'TCPDevice',
        '192.168.1.100',
        '502',
        1000,
        'tcp',
        9600,
        8,
        1,
        'none',
        1,
        8
      );
      expect(deviceManager.devices).toHaveLength(1);
    });

    test('should add RTU device', () => {
      ModbusDevice.mockImplementation((name, address, port, timeout, type, baudRate, dataBits, stopBits, parity, unitId, portsCount) => ({
        name,
        type,
        options: { path: address, baudRate, dataBits, stopBits, parity, timeout },
        unitId,
        portsCount,
        init: jest.fn(),
      }));

      const options = {
        type: 'rtu',
        path: '/dev/ttyUSB0',
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        unitId: 1,
        timeout: 2000,
        portsCount: 8
      };

      deviceManager.addDevice('RTUDevice', options);

      expect(ModbusDevice).toHaveBeenCalledWith(
        'RTUDevice',
        '/dev/ttyUSB0',
        null,
        2000,
        'rtu',
        9600,
        8,
        1,
        'none',
        1,
        8
      );
      expect(deviceManager.devices).toHaveLength(1);
    });

    test('should use default values for optional parameters', () => {
      const options = {
        type: 'tcp',
        host: '192.168.1.100',
        port: '502'
      };

      deviceManager.addDevice('Device', options);

      expect(ModbusDevice).toHaveBeenCalledWith(
        'Device',
        '192.168.1.100',
        '502',
        1000,
        'tcp',
        9600,
        8,
        1,
        'none',
        1,
        8
      );
    });
  });

  describe('removeDevice', () => {
    test('should remove device from list', () => {
      const device = {
        name: 'TestDevice',
        type: 'tcp',
        options: {},
        portsCount: 8,
        init: jest.fn(),
      };
      deviceManager.devices.push(device);

      deviceManager.removeDevice(device);

      expect(deviceManager.devices).toHaveLength(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should not affect other devices', () => {
      const device1 = { name: 'Device1', type: 'tcp', options: {}, portsCount: 8 };
      const device2 = { name: 'Device2', type: 'tcp', options: {}, portsCount: 8 };
      deviceManager.devices.push(device1, device2);

      deviceManager.removeDevice(device1);

      expect(deviceManager.devices).toHaveLength(1);
      expect(deviceManager.devices[0].name).toBe('Device2');
    });
  });

  describe('getDevice', () => {
    test('should return device by name', () => {
      const device = { name: 'TestDevice', type: 'tcp', options: {}, portsCount: 8 };
      deviceManager.devices.push(device);

      const result = deviceManager.getDevice('TestDevice');

      expect(result).toBe(device);
    });

    test('should return undefined for non-existent device', () => {
      const result = deviceManager.getDevice('NonExistent');
      expect(result).toBeFalsy();
    });
  });

  describe('getDevices', () => {
    test('should return all devices', () => {
      const device1 = { name: 'Device1', type: 'tcp', options: {}, portsCount: 8 };
      const device2 = { name: 'Device2', type: 'rtu', options: {}, portsCount: 8 };
      deviceManager.devices.push(device1, device2);

      const result = deviceManager.getDevices();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Device1');
      expect(result[1].name).toBe('Device2');
    });

    test('should return empty array when no devices', () => {
      const result = deviceManager.getDevices();
      expect(result).toEqual([]);
    });
  });

  describe('saveDevices', () => {
    test('should save TCP device configuration', () => {
      const device = {
        name: 'TCPDevice',
        type: 'tcp',
        options: { host: '192.168.1.100', port: '502', timeout: 1000 },
        portsCount: 8
      };
      deviceManager.devices.push(device);

      deviceManager.saveDevices();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'devices',
        expect.stringContaining('TCPDevice')
      );
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].options.type).toBe('tcp');
      expect(savedData[0].options.host).toBe('192.168.1.100');
      expect(savedData[0].options.port).toBe('502');
    });

    test('should save RTU device configuration', () => {
      const device = {
        name: 'RTUDevice',
        type: 'rtu',
        options: {
          path: '/dev/ttyUSB0',
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          timeout: 2000
        },
        unitId: 1,
        portsCount: 8
      };
      deviceManager.devices.push(device);

      deviceManager.saveDevices();

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].options.type).toBe('rtu');
      expect(savedData[0].options.path).toBe('/dev/ttyUSB0');
      expect(savedData[0].options.unitId).toBe(1);
    });
  });
});
