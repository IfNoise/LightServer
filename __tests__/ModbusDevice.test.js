import ModbusDevice from '../src/models/ModbusDevice.js';

// Mock dependencies
jest.mock('net');
jest.mock('serialport');
jest.mock('jsmodbus');

describe('ModbusDevice', () => {
  describe('Constructor', () => {
    test('should create TCP device with default parameters', () => {
      const device = new ModbusDevice('TestTCP', '192.168.1.100', '502', 1000, 'tcp');
      
      expect(device.name).toBe('TestTCP');
      expect(device.type).toBe('tcp');
      expect(device.options.host).toBe('192.168.1.100');
      expect(device.options.port).toBe('502');
      expect(device.portsCount).toBe(8);
    });

    test('should create RTU device with custom parameters', () => {
      const device = new ModbusDevice(
        'TestRTU',
        '/dev/ttyUSB0',
        null,
        1000,
        'rtu',
        9600,
        8,
        1,
        'none',
        1,
        16
      );
      
      expect(device.name).toBe('TestRTU');
      expect(device.type).toBe('rtu');
      expect(device.options.path).toBe('/dev/ttyUSB0');
      expect(device.options.baudRate).toBe(9600);
      expect(device.unitId).toBe(1);
      expect(device.portsCount).toBe(16);
      expect(device.ports).toEqual(new Array(16).fill(0));
    });

    test('TCP device should have null ports before init', () => {
      const device = new ModbusDevice('TestTCP', '192.168.1.100', '502', 1000, 'tcp');
      expect(device.ports).toBeNull();
    });

    test('RTU device should have initialized ports array', () => {
      const device = new ModbusDevice(
        'TestRTU',
        '/dev/ttyUSB0',
        null,
        1000,
        'rtu'
      );
      expect(device.ports).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });

  describe('Port State Management for RTU', () => {
    let device;

    beforeEach(() => {
      device = new ModbusDevice(
        'TestRTU',
        '/dev/ttyUSB0',
        null,
        1000,
        'rtu',
        9600,
        8,
        1,
        'none',
        1,
        4
      );
    });

    test('should return port state from memory when serial port is not open', async () => {
      device.ports = [100, 200, 300, 400];
      const state = await device.portStateRTU(1);
      expect(state).toEqual([200]);
    });

    test('should return 0 for invalid port index', async () => {
      device.ports = [100, 200];
      const state = await device.portStateRTU(5);
      expect(state).toEqual([0]);
    });

    test('should update local state after writing single port', async () => {
      device.serialPort = { isOpen: true };
      device.client = {
        writeSingleRegister: jest.fn().mockResolvedValue({
          response: { _body: {} }
        })
      };

      device.ports = [0, 0, 0, 0];
      await device.updatePortRTU(2, 500);
      
      expect(device.ports[2]).toBe(500);
    });

    test('should update local state after writing multiple ports', async () => {
      device.serialPort = { isOpen: true };
      device.client = {
        writeMultipleRegisters: jest.fn().mockResolvedValue({
          response: { _body: { valuesAsArray: [10, 20, 30, 40] } }
        })
      };

      device.ports = [0, 0, 0, 0];
      await device.updatePortsRTU([10, 20, 30, 40]);
      
      expect(device.ports).toEqual([10, 20, 30, 40]);
    });
  });

  describe('Request State', () => {
    test('RTU device should return current state from memory', async () => {
      const device = new ModbusDevice(
        'TestRTU',
        '/dev/ttyUSB0',
        null,
        1000,
        'rtu'
      );
      device.ports = [100, 200, 300];
      
      const state = await device.requestStateRTU();
      expect(state).toEqual([100, 200, 300]);
    });
  });

  describe('Type Checking', () => {
    test('should correctly identify TCP device', () => {
      const device = new ModbusDevice('TCP1', '192.168.1.1', '502', 1000, 'tcp');
      expect(device.type).toBe('tcp');
    });

    test('should correctly identify RTU device', () => {
      const device = new ModbusDevice(
        'RTU1',
        '/dev/ttyUSB0',
        null,
        1000,
        'rtu'
      );
      expect(device.type).toBe('rtu');
    });
  });
});
