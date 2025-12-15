const request = require('supertest');
const express = require('express');

// Set environment variables FIRST
process.env.PORT = '3000';
process.env.STORAGE_DEVICES = './storage/devices';
process.env.STORAGE_CHANNELS = './storage/channels';
process.env.STORAGE_TIMERS = './storage/timers';

// Mock DeviceManager module
const mockDeviceManager = {
  getDevices: jest.fn(),
  getDevice: jest.fn(),
  addDevice: jest.fn(),
  removeDevice: jest.fn(),
  saveDevices: jest.fn(),
};

jest.mock('../models/DeviceManager', () => ({
  getInstance: jest.fn(() => mockDeviceManager)
}));

const devicesRoute = require('../routes/devices.route');

describe('Devices API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/devices', devicesRoute);
  });

  describe('GET /api/devices', () => {
    test('should return list of devices', async () => {
      const mockDevices = [
        { name: 'Device1', type: 'tcp', ports: [0, 0, 0] },
        { name: 'Device2', type: 'rtu', ports: [100, 200] },
      ];
      mockDeviceManager.getDevices.mockReturnValue(mockDevices);

      const response = await request(app).get('/api/devices');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDevices);
      expect(mockDeviceManager.getDevices).toHaveBeenCalled();
    });
  });

  describe('GET /api/devices/:name', () => {
    test('should return specific device', async () => {
      const mockDevice = {
        name: 'Device1',
        json: jest.fn().mockReturnValue({ name: 'Device1', type: 'tcp' }),
      };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);

      const response = await request(app).get('/api/devices/Device1');

      expect(response.status).toBe(200);
      expect(mockDeviceManager.getDevice).toHaveBeenCalledWith('Device1');
    });

    test('should return error for non-existent device', async () => {
      mockDeviceManager.getDevice.mockReturnValue(null);

      const response = await request(app).get('/api/devices/NonExistent');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'error' });
    });
  });

  describe('POST /api/devices/add', () => {
    test('should add TCP device successfully', async () => {
      const response = await request(app)
        .post('/api/devices/add')
        .send({
          name: 'TCPDevice',
          address: '192.168.1.100',
          port: '502',
          timeout: 1000,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockDeviceManager.addDevice).toHaveBeenCalledWith(
        'TCPDevice',
        expect.objectContaining({
          type: 'tcp',
          host: '192.168.1.100',
          port: '502',
        })
      );
    });

    test('should add RTU device successfully', async () => {
      const response = await request(app)
        .post('/api/devices/add')
        .send({
          name: 'RTUDevice',
          type: 'rtu',
          path: '/dev/ttyUSB0',
          baudRate: 9600,
          unitId: 1,
          portsCount: 16,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockDeviceManager.addDevice).toHaveBeenCalledWith(
        'RTUDevice',
        expect.objectContaining({
          type: 'rtu',
          path: '/dev/ttyUSB0',
          baudRate: 9600,
          unitId: 1,
          portsCount: 16,
        })
      );
    });

    test('should return error when name is missing', async () => {
      const response = await request(app)
        .post('/api/devices/add')
        .send({
          address: '192.168.1.100',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Device name is required');
    });

    test('should return error when TCP device address is missing', async () => {
      const response = await request(app)
        .post('/api/devices/add')
        .send({
          name: 'TCPDevice',
          port: '502',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('IP address is required for TCP devices');
    });

    test('should return error when RTU device path is missing', async () => {
      const response = await request(app)
        .post('/api/devices/add')
        .send({
          name: 'RTUDevice',
          type: 'rtu',
          baudRate: 9600,
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Serial port path is required for RTU devices');
    });

    test('should use default values for optional parameters', async () => {
      const response = await request(app)
        .post('/api/devices/add')
        .send({
          name: 'RTUDevice',
          type: 'rtu',
          path: '/dev/ttyUSB0',
        });

      expect(response.status).toBe(200);
      expect(mockDeviceManager.addDevice).toHaveBeenCalledWith(
        'RTUDevice',
        expect.objectContaining({
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          unitId: 1,
          portsCount: 8,
        })
      );
    });
  });

  describe('DELETE /api/devices/:name', () => {
    test('should remove device successfully', async () => {
      const mockDevice = { name: 'Device1' };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);

      const response = await request(app)
        .delete('/api/devices/Device1');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockDeviceManager.removeDevice).toHaveBeenCalledWith(mockDevice);
    });

    test('should return error for non-existent device', async () => {
      mockDeviceManager.getDevice.mockReturnValue(null);

      const response = await request(app)
        .delete('/api/devices/NonExistent');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /api/devices/:name', () => {
    test('should update TCP device parameters', async () => {
      const mockDevice = {
        name: 'TCPDevice',
        type: 'tcp',
        options: { host: '192.168.1.100', port: '502', timeout: 1000 },
      };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);
      mockDeviceManager.saveDevices = jest.fn();

      const response = await request(app)
        .patch('/api/devices/TCPDevice')
        .send({
          host: '192.168.1.200',
          port: '503',
          timeout: 2000,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockDevice.options.host).toBe('192.168.1.200');
      expect(mockDevice.options.port).toBe('503');
      expect(mockDevice.options.timeout).toBe(2000);
      expect(mockDeviceManager.saveDevices).toHaveBeenCalled();
    });

    test('should update RTU device parameters', async () => {
      const mockDevice = {
        name: 'RTUDevice',
        type: 'rtu',
        options: {
          path: '/dev/ttyUSB0',
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          timeout: 1000,
        },
        unitId: 1,
      };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);
      mockDeviceManager.saveDevices = jest.fn();

      const response = await request(app)
        .patch('/api/devices/RTUDevice')
        .send({
          path: '/dev/ttyUSB1',
          baudRate: 19200,
          unitId: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockDevice.options.path).toBe('/dev/ttyUSB1');
      expect(mockDevice.options.baudRate).toBe(19200);
      expect(mockDevice.unitId).toBe(2);
      expect(mockDeviceManager.saveDevices).toHaveBeenCalled();
    });

    test('should not update TCP parameters on RTU device', async () => {
      const mockDevice = {
        name: 'RTUDevice',
        type: 'rtu',
        options: { path: '/dev/ttyUSB0', baudRate: 9600 },
        unitId: 1,
      };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);
      mockDeviceManager.saveDevices = jest.fn();

      const response = await request(app)
        .patch('/api/devices/RTUDevice')
        .send({
          host: '192.168.1.100',
          port: '502',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockDevice.options.host).toBeUndefined();
      expect(mockDevice.options.port).toBeUndefined();
    });

    test('should not update RTU parameters on TCP device', async () => {
      const mockDevice = {
        name: 'TCPDevice',
        type: 'tcp',
        options: { host: '192.168.1.100', port: '502', timeout: 1000 },
      };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);
      mockDeviceManager.saveDevices = jest.fn();

      const response = await request(app)
        .patch('/api/devices/TCPDevice')
        .send({
          path: '/dev/ttyUSB0',
          baudRate: 9600,
          unitId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockDevice.options.path).toBeUndefined();
      expect(mockDevice.options.baudRate).toBeUndefined();
    });

    test('should return error for non-existent device', async () => {
      mockDeviceManager.getDevice.mockReturnValue(null);

      const response = await request(app)
        .patch('/api/devices/NonExistent')
        .send({ timeout: 2000 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/devices/:name/state', () => {
    test('should return device state', async () => {
      const mockDevice = {
        requestState: jest.fn().mockResolvedValue([100, 200, 300]),
      };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);

      const response = await request(app).get('/api/devices/Device1/state');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ state: [100, 200, 300] });
      expect(mockDevice.requestState).toHaveBeenCalled();
    });

    test('should return error for non-existent device', async () => {
      mockDeviceManager.getDevice.mockReturnValue(null);

      const response = await request(app).get('/api/devices/NonExistent/state');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'error' });
    });
  });
});
