import request from 'supertest';
import express from 'express';

// Set environment variables
process.env.PORT = '3000';
process.env.STORAGE_TIMERS = './storage/timers';

// Mock TimerManager
const mockTimerManager = {
  getTimers: jest.fn(),
  getTimer: jest.fn(),
  addTimer: jest.fn(),
  removeTimer: jest.fn(),
  saveTimers: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

jest.mock('../src/models/ChannelsManager.js', () => ({
  default: {
    getInstance: jest.fn(() => ({}))
  }
}));

jest.mock('../src/models/TimerManager.js', () => ({
  default: {
    getInstance: jest.fn(() => mockTimerManager)
  }
}));

import timersRoute from '../src/routes/timers.route.js';

describe('Timers API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/timers', timersRoute);
  });

  describe('GET /api/timers', () => {
    test('should return list of timers', async () => {
      const mockTimers = [
        { name: 'Timer1', state: 'stopped', steps: 10 },
        { name: 'Timer2', state: 'running', steps: 20 },
      ];
      mockTimerManager.getTimers.mockReturnValue(mockTimers);

      const response = await request(app).get('/api/timers');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTimers);
      expect(mockTimerManager.getTimers).toHaveBeenCalled();
    });
  });

  describe('GET /api/timers/:name', () => {
    test('should return specific timer', async () => {
      const mockTimer = {
        name: 'Timer1',
        state: 'stopped',
        json: jest.fn().mockReturnValue({ name: 'Timer1', state: 'stopped' }),
      };
      mockTimerManager.getTimer.mockReturnValue(mockTimer);

      const response = await request(app).get('/api/timers/Timer1');

      expect(response.status).toBe(200);
      expect(mockTimerManager.getTimer).toHaveBeenCalledWith('Timer1');
      expect(mockTimer.json).toHaveBeenCalled();
    });

    test('should return error for non-existent timer', async () => {
      mockTimerManager.getTimer.mockReturnValue(null);

      const response = await request(app).get('/api/timers/NonExistent');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Timer not found');
    });
  });

  describe('POST /api/timers/add', () => {
    test('should add timer successfully', async () => {
      mockTimerManager.addTimer.mockReturnValue({ status: 'ok' });
      
      const response = await request(app)
        .post('/api/timers/add')
        .send({ name: 'NewTimer' });

      expect(response.status).toBe(200);
      expect(mockTimerManager.addTimer).toHaveBeenCalled();
    });
  });

  describe('POST /api/timers/remove', () => {
    test('should remove timer successfully', async () => {
      mockTimerManager.removeTimer.mockReturnValue({ status: 'ok' });

      const response = await request(app)
        .post('/api/timers/remove')
        .send({ name: 'Timer1' });

      expect(response.status).toBe(200);
      expect(mockTimerManager.removeTimer).toHaveBeenCalledWith('Timer1');
    });
  });

  describe('POST /api/timers/:name/setSteps', () => {
    test('should update timer steps', async () => {
      const mockTimer = {
        name: 'Timer1',
        setSteps: jest.fn(),
      };
      mockTimerManager.getTimer.mockReturnValue(mockTimer);

      const response = await request(app)
        .post('/api/timers/Timer1/setSteps')
        .send({ steps: 20 });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockTimer.setSteps).toHaveBeenCalledWith(20);
    });

    test('should return error for non-existent timer', async () => {
      mockTimerManager.getTimer.mockReturnValue(null);

      const response = await request(app)
        .post('/api/timers/NonExistent/setSteps')
        .send({ steps: 20 });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Timer not found');
    });
  });

  describe('POST /api/timers/:name/setStepTime', () => {
    test('should update timer stepTime', async () => {
      const mockTimer = {
        name: 'Timer1',
        setStepTime: jest.fn(),
      };
      mockTimerManager.getTimer.mockReturnValue(mockTimer);

      const response = await request(app)
        .post('/api/timers/Timer1/setStepTime')
        .send({ stepTime: 120 });

      expect(response.status).toBe(200);
      expect(mockTimer.setStepTime).toHaveBeenCalledWith(120);
    });
  });

  describe('POST /api/timers/:name/setSunriseTime', () => {
    test('should update timer sunriseTime', async () => {
      const mockTimer = {
        name: 'Timer1',
        setSunriseTime: jest.fn(),
      };
      mockTimerManager.getTimer.mockReturnValue(mockTimer);

      const response = await request(app)
        .post('/api/timers/Timer1/setSunriseTime')
        .send({ time: 420 });

      expect(response.status).toBe(200);
      expect(mockTimer.setSunriseTime).toHaveBeenCalledWith(420);
    });
  });

  describe('POST /api/timers/:name/setSunsetTime', () => {
    test('should update timer sunsetTime', async () => {
      const mockTimer = {
        name: 'Timer1',
        setSunsetTime: jest.fn(),
      };
      mockTimerManager.getTimer.mockReturnValue(mockTimer);

      const response = await request(app)
        .post('/api/timers/Timer1/setSunsetTime')
        .send({ time: 1140 });

      expect(response.status).toBe(200);
      expect(mockTimer.setSunsetTime).toHaveBeenCalledWith(1140);
    });
  });

  describe('POST /api/timers/:name/start', () => {
    test('should start timer', async () => {
      const mockTimer = {
        name: 'Timer1',
        start: jest.fn(),
      };
      mockTimerManager.getTimer.mockReturnValue(mockTimer);

      const response = await request(app)
        .post('/api/timers/Timer1/start');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockTimer.start).toHaveBeenCalled();
    });

  });

  describe('POST /api/timers/:name/stop', () => {
    test('should stop timer', async () => {
      const mockTimer = {
        name: 'Timer1',
        stop: jest.fn(),
      };
      mockTimerManager.getTimer.mockReturnValue(mockTimer);

      const response = await request(app)
        .post('/api/timers/Timer1/stop');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(mockTimer.stop).toHaveBeenCalled();
    });
  });

  describe('POST /api/timers/:name/subscribe', () => {
    test('should subscribe channels to timer', async () => {
      mockTimerManager.subscribe.mockReturnValue({ status: 'ok' });

      const response = await request(app)
        .post('/api/timers/Timer1/subscribe')
        .send({ channels: ['Channel1', 'Channel2'] });

      expect(response.status).toBe(200);
      expect(mockTimerManager.subscribe).toHaveBeenCalledWith('Timer1', ['Channel1', 'Channel2']);
    });
  });

  describe('POST /api/timers/:name/unsubscribe', () => {
    test('should unsubscribe channels from timer', async () => {
      mockTimerManager.unsubscribe.mockReturnValue({ status: 'ok' });

      const response = await request(app)
        .post('/api/timers/Timer1/unsubscribe')
        .send({ channels: ['Channel1'] });

      expect(response.status).toBe(200);
      expect(mockTimerManager.unsubscribe).toHaveBeenCalledWith('Timer1', ['Channel1']);
    });
  });
});
