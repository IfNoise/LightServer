import TimerManager from '../src/models/TimerManager.js';
import { Timer } from '../src/models/Timer.js';
import { LocalStorage } from 'node-localstorage';

// Mock dependencies
jest.mock('node-localstorage');
jest.mock('../src/models/Timer');

describe('TimerManager', () => {
  let timerManager;
  let mockLocalStorage;
  let mockChannelManager;

  beforeEach(() => {
    // Reset singleton
    TimerManager.instance = null;

    // Setup mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    LocalStorage.mockImplementation(() => mockLocalStorage);

    // Setup mock ChannelManager
    mockChannelManager = {
      getChannel: jest.fn(),
      channels: [],
    };

    // Setup mock Timer
    Timer.mockImplementation((name) => ({
      name,
      state: 'stopped',
      steps: 10,
      stepTime: 60,
      sunriseTime: 360,
      sunsetTime: 1080,
      channels: [],
      start: jest.fn(),
      stop: jest.fn(),
      addChannel: jest.fn(),
      removeChannel: jest.fn(),
      setSteps: jest.fn(),
      setStepTime: jest.fn(),
      setSunriseTime: jest.fn(),
      setSunsetTime: jest.fn(),
      json: jest.fn(function() {
        return {
          name: this.name,
          state: this.state,
          steps: this.steps,
          stepTime: this.stepTime,
          sunriseTime: this.sunriseTime,
          sunsetTime: this.sunsetTime,
          channels: this.channels,
        };
      }),
      on: jest.fn(),
    }));

    timerManager = TimerManager.getInstance(mockChannelManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = TimerManager.getInstance(mockChannelManager);
      const instance2 = TimerManager.getInstance(mockChannelManager);
      expect(instance1).toBe(instance2);
    });
  });

  describe('init', () => {
    test('should call loadTimers', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      timerManager.init();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('timers');
    });

    test('should load timers from storage', () => {
      const storedTimers = JSON.stringify([
        {
          name: 'Timer1',
          steps: 10,
          stepTime: 60,
          sunriseTime: 360,
          sunsetTime: 1080,
          channels: ['Channel1']
        }
      ]);
      mockLocalStorage.getItem.mockReturnValue(storedTimers);

      const mockChannel = { name: 'Channel1' };
      mockChannelManager.getChannel.mockReturnValue(mockChannel);

      timerManager.init();

      expect(Timer).toHaveBeenCalledWith('Timer1');
      expect(timerManager.timers).toHaveLength(1);
    });
  });

  describe('addTimer', () => {
    test('should add timer', () => {
      timerManager.addTimer('Timer1');

      expect(Timer).toHaveBeenCalledWith('Timer1');
      expect(timerManager.timers).toHaveLength(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should setup event listeners', () => {
      const mockTimer = {
        name: 'Timer1',
        on: jest.fn(),
        json: jest.fn(() => ({ name: 'Timer1' })),
      };
      Timer.mockImplementation(() => mockTimer);

      timerManager.addTimer('Timer1');

      expect(mockTimer.on).toHaveBeenCalledWith('stateUpdate', expect.any(Function));
      expect(mockTimer.on).toHaveBeenCalledWith('stepTimeChanged', expect.any(Function));
      expect(mockTimer.on).toHaveBeenCalledWith('stepsChanged', expect.any(Function));
      expect(mockTimer.on).toHaveBeenCalledWith('sunriseTimeChanged', expect.any(Function));
      expect(mockTimer.on).toHaveBeenCalledWith('sunsetTimeChanged', expect.any(Function));
      expect(mockTimer.on).toHaveBeenCalledWith('channelAdded', expect.any(Function));
      expect(mockTimer.on).toHaveBeenCalledWith('channelRemoved', expect.any(Function));
    });
  });

  describe('removeTimer', () => {
    test('should remove timer from list', () => {
      const timer = {
        name: 'Timer1',
        json: jest.fn(() => ({ name: 'Timer1' })),
      };
      timerManager.timers.push(timer);

      timerManager.removeTimer(timer);

      expect(timerManager.timers).toHaveLength(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('should not affect other timers', () => {
      const timer1 = { name: 'Timer1', json: jest.fn(() => ({ name: 'Timer1' })) };
      const timer2 = { name: 'Timer2', json: jest.fn(() => ({ name: 'Timer2' })) };
      timerManager.timers.push(timer1, timer2);

      timerManager.removeTimer(timer1);

      expect(timerManager.timers).toHaveLength(1);
      expect(timerManager.timers[0].name).toBe('Timer2');
    });
  });

  describe('getTimer', () => {
    test('should return timer by name', () => {
      const timer = { name: 'Timer1' };
      timerManager.timers.push(timer);

      const result = timerManager.getTimer('Timer1');

      expect(result).toBe(timer);
    });

    test('should return undefined for non-existent timer', () => {
      const result = timerManager.getTimer('NonExistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getTimers', () => {
    test('should return all timers', () => {
      const timer1 = { name: 'Timer1' };
      const timer2 = { name: 'Timer2' };
      timerManager.timers.push(timer1, timer2);

      const result = timerManager.getTimers();

      expect(result).toHaveLength(2);
      expect(result).toEqual([timer1, timer2]);
    });

    test('should return empty array when no timers', () => {
      const result = timerManager.getTimers();
      expect(result).toEqual([]);
    });
  });

  describe('saveTimers', () => {
    test('should save timer configuration', () => {
      const timer = {
        name: 'Timer1',
        json: jest.fn(() => ({
          name: 'Timer1',
          steps: 10,
          stepTime: 60,
          sunriseTime: 360,
          sunsetTime: 1080,
          channels: []
        })),
      };
      timerManager.timers.push(timer);

      timerManager.saveTimers();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'timers',
        expect.stringContaining('Timer1')
      );
      expect(timer.json).toHaveBeenCalled();
    });
  });
});
