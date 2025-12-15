const request = require('supertest');
const express = require('express');

// Set environment variables
process.env.PORT = '3000';
process.env.STORAGE_CHANNELS = './storage/channels';

// Mock ChannelsManager
const mockChannelsManager = {
  getChannels: jest.fn(),
  getChannelsJSON: jest.fn(),
  getChannel: jest.fn(),
  addChannel: jest.fn(),
  removeChannel: jest.fn(),
  saveChannels: jest.fn(),
  channels: [],
};

jest.mock('../models/DeviceManager', () => ({
  getInstance: jest.fn(() => ({}))
}));

jest.mock('../models/ChannelsManager', () => ({
  getInstance: jest.fn(() => mockChannelsManager)
}));

const lightChannelsRoute = require('../routes/lightChannels.route');

describe('LightChannels API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/lightChannels', lightChannelsRoute);
  });

  describe('GET /api/lightChannels', () => {
    test('should return list of channels', async () => {
      const mockChannels = [
        { name: 'Channel1', device: 'Device1', port: 0, level: 0 },
        { name: 'Channel2', device: 'Device2', port: 1, level: 100 },
      ];
      mockChannelsManager.getChannelsJSON.mockReturnValue(mockChannels);

      const response = await request(app).get('/api/lightChannels');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChannels);
      expect(mockChannelsManager.getChannelsJSON).toHaveBeenCalled();
    });
  });

  describe('GET /api/lightChannels/:name', () => {
    test('should return specific channel', async () => {
      const mockChannel = {
        name: 'Channel1',
        device: { name: 'Device1' },
        port: 0,
        json: jest.fn().mockReturnValue({ name: 'Channel1', device: 'Device1', port: 0 }),
      };
      mockChannelsManager.getChannel.mockReturnValue(mockChannel);

      const response = await request(app).get('/api/lightChannels/Channel1');

      expect(response.status).toBe(200);
      expect(mockChannelsManager.getChannel).toHaveBeenCalledWith('Channel1');
      expect(mockChannel.json).toHaveBeenCalled();
    });

    test('should return error for non-existent channel', async () => {
      mockChannelsManager.getChannel.mockReturnValue(null);

      const response = await request(app).get('/api/lightChannels/NonExistent');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'error' });
    });
  });

  describe('POST /api/lightChannels/add', () => {
    test('should add channel successfully', async () => {
      const response = await request(app)
        .post('/api/lightChannels/add')
        .send({
          name: 'NewChannel',
          device: 'Device1',
          port: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockChannelsManager.addChannel).toHaveBeenCalledWith({
        name: 'NewChannel',
        device: 'Device1',
        port: 0
      });
    });
  });

  describe('POST /api/lightChannels/remove', () => {
    test('should remove channel successfully', async () => {
      const response = await request(app)
        .post('/api/lightChannels/remove')
        .send({ name: 'Channel1' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockChannelsManager.removeChannel).toHaveBeenCalledWith('Channel1');
    });

    test('should return error when name is missing', async () => {
      const response = await request(app)
        .post('/api/lightChannels/remove')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/lightChannels/:name/setMaxLevel', () => {
    test('should update channel maxLevel', async () => {
      const mockChannel = {
        name: 'Channel1',
        setMaxLevel: jest.fn(),
      };
      mockChannelsManager.getChannel.mockReturnValue(mockChannel);

      const response = await request(app)
        .post('/api/lightChannels/Channel1/setMaxLevel')
        .send({ maxLevel: 32767 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockChannel.setMaxLevel).toHaveBeenCalledWith(32767);
    });

    test('should return error for non-existent channel', async () => {
      mockChannelsManager.getChannel.mockReturnValue(null);

      const response = await request(app)
        .post('/api/lightChannels/NonExistent/setMaxLevel')
        .send({ maxLevel: 32767 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/lightChannels/:name/setPort', () => {
    test('should update channel port', async () => {
      const mockChannel = {
        name: 'Channel1',
        setPort: jest.fn(),
      };
      mockChannelsManager.getChannel.mockReturnValue(mockChannel);

      const response = await request(app)
        .post('/api/lightChannels/Channel1/setPort')
        .send({ port: 5 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockChannel.setPort).toHaveBeenCalledWith(5);
    });
  });

});
