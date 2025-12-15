const ChannelsManager = require('../models/ChannelsManager');
const LightChannel = require('../models/LightChannel');
const LocalStorage = require('node-localstorage').LocalStorage;

// Mock dependencies
jest.mock('node-localstorage');
jest.mock('../models/LightChannel');

describe('ChannelsManager', () => {
  let channelsManager;
  let mockLocalStorage;
  let mockDeviceManager;

  beforeEach(() => {
    // Reset singleton
    ChannelsManager.instance = null;

    // Setup mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    LocalStorage.mockImplementation(() => mockLocalStorage);

    // Setup mock DeviceManager
    mockDeviceManager = {
      getDevice: jest.fn(),
    };

    // Setup mock LightChannel
    LightChannel.mockImplementation((name, device, port) => ({
      name,
      device,
      port,
      level: 0,
      maxLevel: 32767,
      json: jest.fn(() => ({ name, device: device?.name, port })),
      setPersentage: jest.fn(),
      setMaxLevel: jest.fn(),
      setDevice: jest.fn(),
      setPort: jest.fn(),
    }));

    channelsManager = ChannelsManager.getInstance(mockDeviceManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = ChannelsManager.getInstance(mockDeviceManager);
      const instance2 = ChannelsManager.getInstance(mockDeviceManager);
      expect(instance1).toBe(instance2);
    });
  });

  describe('init', () => {
    test('should call loadChannels', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      channelsManager.init();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('channels');
    });

    test('should load channels from storage', () => {
      const mockDevice = { name: 'Device1' };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);

      const storedChannels = JSON.stringify([
        { name: 'Channel1', device: 'Device1', port: 0 }
      ]);
      mockLocalStorage.getItem.mockReturnValue(storedChannels);

      channelsManager.init();

      expect(LightChannel).toHaveBeenCalledWith('Channel1', mockDevice, 0);
      expect(channelsManager.channels).toHaveLength(1);
    });
  });

  describe('addChannel', () => {
    test('should add channel with device', () => {
      const mockDevice = { name: 'Device1' };
      mockDeviceManager.getDevice.mockReturnValue(mockDevice);

      channelsManager.addChannel({ name: 'Channel1', device: 'Device1', port: 0 });

      expect(LightChannel).toHaveBeenCalledWith('Channel1', mockDevice, 0);
      expect(channelsManager.channels).toHaveLength(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should add channel without device', () => {
      mockDeviceManager.getDevice.mockReturnValue(null);

      channelsManager.addChannel({ name: 'Channel1', device: 'NonExistent', port: 0 });

      expect(LightChannel).toHaveBeenCalledWith('Channel1', null, 0);
      expect(channelsManager.channels).toHaveLength(1);
    });

    test('should throw error if name is missing', () => {
      expect(() => {
        channelsManager.addChannel({ device: 'Device1', port: 0 });
      }).toThrow();
    });
  });

  describe('removeChannel', () => {
    test('should remove channel from list', () => {
      const channel = {
        name: 'Channel1',
        device: null,
        port: 0,
        json: jest.fn(() => ({ name: 'Channel1', device: null, port: 0 })),
      };
      channelsManager.channels.push(channel);

      channelsManager.removeChannel(channel);

      expect(channelsManager.channels).toHaveLength(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should not affect other channels', () => {
      const channel1 = { name: 'Channel1', json: jest.fn(() => ({ name: 'Channel1' })) };
      const channel2 = { name: 'Channel2', json: jest.fn(() => ({ name: 'Channel2' })) };
      channelsManager.channels.push(channel1, channel2);

      channelsManager.removeChannel(channel1);

      expect(channelsManager.channels).toHaveLength(1);
      expect(channelsManager.channels[0].name).toBe('Channel2');
    });
  });

  describe('getChannel', () => {
    test('should return channel by name', () => {
      const channel = { name: 'Channel1' };
      channelsManager.channels.push(channel);

      const result = channelsManager.getChannel('Channel1');

      expect(result).toBe(channel);
    });

    test('should return undefined for non-existent channel', () => {
      const result = channelsManager.getChannel('NonExistent');
      expect(result).toBeFalsy();
    });
  });

  describe('getChannels', () => {
    test('should return all channels', () => {
      const channel1 = { name: 'Channel1' };
      const channel2 = { name: 'Channel2' };
      channelsManager.channels.push(channel1, channel2);

      const result = channelsManager.getChannels();

      expect(result).toHaveLength(2);
      expect(result).toEqual([channel1, channel2]);
    });

    test('should return empty array when no channels', () => {
      const result = channelsManager.getChannels();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('saveChannels', () => {
    test('should save channel configuration', () => {
      const channel = {
        name: 'Channel1',
        device: { name: 'Device1' },
        port: 0,
        json: jest.fn(() => ({ name: 'Channel1', device: 'Device1', port: 0 })),
      };
      channelsManager.channels.push(channel);

      channelsManager.saveChannels();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'channels',
        expect.stringContaining('Channel1')
      );
      expect(channel.json).toHaveBeenCalled();
    });
  });
});
