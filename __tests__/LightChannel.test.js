const LightChannel = require('../models/LightChannel');

// Mock localStorage
jest.mock('node-localstorage', () => {
  return {
    LocalStorage: jest.fn().mockImplementation(() => ({
      getItem: jest.fn(),
      setItem: jest.fn(),
    })),
  };
});

describe('LightChannel', () => {
  let mockDevice;
  let channel;

  beforeEach(() => {
    mockDevice = {
      name: 'TestDevice',
      updatePort: jest.fn().mockResolvedValue(true),
    };
    channel = new LightChannel('TestChannel', mockDevice, 0);
    channel.init();
  });

  describe('Constructor and Initialization', () => {
    test('should create channel with correct properties', () => {
      expect(channel.name).toBe('TestChannel');
      expect(channel.device).toBe(mockDevice);
      expect(channel.port).toBe(0);
      expect(channel.manual).toBe(true);
      expect(channel.currentPercentage).toBe(0);
    });

    test('should initialize maxLevel from storage', () => {
      const ch = new LightChannel('Ch1', mockDevice, 1);
      ch.localStorage.getItem = jest.fn().mockReturnValue('10000');
      ch.init();
      expect(ch.maxLevel).toBe(10000);
    });
  });

  describe('setMaxLevel', () => {
    test('should update maxLevel and save to storage', () => {
      channel.setMaxLevel(20000);
      expect(channel.maxLevel).toBe(20000);
      expect(channel.localStorage.setItem).toHaveBeenCalledWith('maxLevel', 20000);
    });

    test('should recalculate level when currentPercentage is set', async () => {
      channel.maxLevel = 30000;
      channel.currentPercentage = 50;
      
      await channel.setMaxLevel(20000);
      
      expect(mockDevice.updatePort).toHaveBeenCalledWith(0, 10000);
    });

    test('should set 100% when manual mode and no currentPercentage', async () => {
      channel.manual = true;
      channel.currentPercentage = undefined;
      
      await channel.setMaxLevel(32767);
      
      expect(mockDevice.updatePort).toHaveBeenCalledWith(0, 32767);
    });

    test('should throw error for NaN maxLevel', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      channel.setMaxLevel(NaN);
      expect(consoleSpy).toHaveBeenCalledWith('Max level must be a number');
      consoleSpy.mockRestore();
    });
  });

  describe('setPersentage', () => {
    beforeEach(() => {
      channel.maxLevel = 32767;
    });

    test('should calculate and set correct level', async () => {
      await channel.setPersentage(50);
      
      expect(channel.level).toBe(16383);
      expect(channel.currentPercentage).toBe(50);
      expect(mockDevice.updatePort).toHaveBeenCalledWith(0, 16383);
    });

    test('should set level to 0 when percentage is 0', async () => {
      channel.level = 100; // Устанавливаем начальный уровень отличный от 0
      await channel.setPersentage(0);
      
      expect(channel.level).toBe(0);
      expect(mockDevice.updatePort).toHaveBeenCalledWith(0, 0);
    });

    test('should set level to maxLevel when percentage is 100', async () => {
      await channel.setPersentage(100);
      
      expect(channel.level).toBe(32767);
      expect(mockDevice.updatePort).toHaveBeenCalledWith(0, 32767);
    });

    test('should not update if new level equals current level', async () => {
      channel.level = 16383;
      await channel.setPersentage(50);
      
      // First call sets it, no second call since level is same
      expect(mockDevice.updatePort).toHaveBeenCalledTimes(0);
    });

    test('should throw error for percentage out of range', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await channel.setPersentage(150);
      expect(consoleSpy).toHaveBeenCalledWith('Persentage must be between 0 and 100');
      
      await channel.setPersentage(-10);
      expect(consoleSpy).toHaveBeenCalledWith('Persentage must be between 0 and 100');
      
      consoleSpy.mockRestore();
    });

    test('should throw error for NaN percentage', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await channel.setPersentage(NaN);
      expect(consoleSpy).toHaveBeenCalledWith('Persentage must be a number');
      consoleSpy.mockRestore();
    });
  });

  describe('setPort', () => {
    test('should update port and save to storage', () => {
      channel.setPort(5);
      expect(channel.port).toBe(5);
      expect(channel.localStorage.setItem).toHaveBeenCalledWith('port', 5);
    });

    test('should throw error for NaN port', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      channel.setPort(NaN);
      expect(consoleSpy).toHaveBeenCalledWith('Port must be a number');
      consoleSpy.mockRestore();
    });
  });

  describe('setDevice', () => {
    test('should update device', () => {
      const newDevice = { name: 'NewDevice' };
      channel.setDevice(newDevice);
      expect(channel.device).toBe(newDevice);
    });

    test('should not update if device is same', () => {
      const currentDevice = channel.device;
      channel.setDevice(mockDevice);
      expect(channel.device).toBe(currentDevice);
    });
  });

  describe('json', () => {
    test('should return correct JSON representation', () => {
      channel.maxLevel = 25000;
      const json = channel.json();
      
      expect(json).toEqual({
        name: 'TestChannel',
        device: 'TestDevice',
        port: 0,
        maxLevel: 25000,
        manual: true,
      });
    });

    test('should handle missing device', () => {
      channel.device = null;
      const json = channel.json();
      expect(json.device).toBe('');
    });
  });

  describe('Integration: maxLevel change triggers level recalculation', () => {
    test('should recalculate level when maxLevel changes and timer is running', async () => {
      channel.maxLevel = 32767;
      channel.level = 0; // Начальное значение
      
      // Simulate timer setting percentage to 75%
      await channel.setPersentage(75);
      expect(channel.level).toBe(24575); // 75% of 32767
      expect(channel.currentPercentage).toBe(75);

      // User changes maxLevel via fader
      await channel.setMaxLevel(16383);
      
      // Level should be recalculated with new maxLevel but same percentage
      expect(channel.level).toBe(12287); // 75% of 16383
      expect(mockDevice.updatePort).toHaveBeenLastCalledWith(0, 12287);
    });
  });
});
