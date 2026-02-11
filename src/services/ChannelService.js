import ChannelsManager from '../models/ChannelsManager.js';
import DeviceManager from '../models/DeviceManager.js';

/**
 * Service for managing light channels business logic
 */
class ChannelService {
  constructor() {
    this.deviceManager = DeviceManager.getInstance();
    this.channelManager = ChannelsManager.getInstance(this.deviceManager);
  }

  /**
   * Get all channels
   * @returns {Array} List of all channels
   */
  getAllChannels() {
    return this.channelManager.getChannelsJSON();
  }

  /**
   * Get channel by name
   * @param {string} name - Channel name
   * @returns {Object|null} Channel object or null if not found
   */
  getChannelByName(name) {
    return this.channelManager.getChannel(name);
  }

  /**
   * Create a new channel
   * @param {Object} channelData - Channel configuration data
   * @returns {Object} Result with status and channel info
   */
  createChannel(channelData) {
    const { name, device, port } = channelData;
    return this.channelManager.addChannel({ name, device, port });
  }

  /**
   * Update channel partially
   * @param {string} name - Channel name
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Result with status
   */
  async updateChannel(name, updateData) {
    const channel = this.channelManager.getChannel(name);
    if (!channel) {
      return { status: "error", message: "Channel not found" };
    }
    
    const { maxLevel, minLevel, port } = updateData;
    
    if (maxLevel !== undefined) {
      await channel.setMaxLevel(maxLevel);
    }
    if (minLevel !== undefined) {
      await channel.setMinLevel(minLevel);
    }
    if (port !== undefined) {
      channel.setPort(port);
    }
    
    this.channelManager.saveChannels();
    return { status: "ok" };
  }

  /**
   * Replace channel completely
   * @param {string} name - Channel name
   * @param {Object} channelData - New channel data
   * @returns {Promise<Object>} Result with status
   */
  async replaceChannel(name, channelData) {
    const channel = this.channelManager.getChannel(name);
    if (!channel) {
      return { status: "error", message: "Channel not found" };
    }
    
    const { device, port, maxLevel, minLevel } = channelData;
    
    // Remove and recreate channel
    this.channelManager.removeChannel(name);
    const result = this.channelManager.addChannel({ name, device, port });
    
    if (result.status === "ok") {
      const newChannel = this.channelManager.getChannel(name);
      if (newChannel) {
        if (maxLevel !== undefined) {
          await newChannel.setMaxLevel(maxLevel);
        }
        if (minLevel !== undefined) {
          await newChannel.setMinLevel(minLevel);
        }
        this.channelManager.saveChannels();
      }
    }
    
    return result;
  }

  /**
   * Delete channel
   * @param {string} name - Channel name
   * @returns {Object} Result with status
   */
  deleteChannel(name) {
    return this.channelManager.removeChannel(name);
  }

  /**
   * Get channel state
   * @param {string} name - Channel name
   * @returns {Promise<Object>} Channel state
   */
  async getChannelState(name) {
    const channel = this.channelManager.getChannel(name);
    if (!channel) {
      return { status: "error", message: "Channel not found" };
    }
    
    const state = await channel.getState();
    return { state };
  }

  /**
   * Get all channels state
   * @returns {Promise<Object>} All channels state
   */
  async getAllChannelsState() {
    if (this.channelManager.channels.length === 0) {
      return { status: "error", message: "No channels found" };
    }
    
    const state = await this.channelManager.getChannelsState();
    return state;
  }

  /**
   * Set channel max level
   * @param {string} name - Channel name
   * @param {number} maxLevel - Max level value
   * @returns {Promise<Object>} Result
   */
  async setChannelMaxLevel(name, maxLevel) {
    const channel = this.channelManager.getChannel(name);
    if (!channel) {
      return { status: "error", message: "Channel not found" };
    }
    
    return await channel.setMaxLevel(maxLevel);
  }

  /**
   * Set channel port
   * @param {string} name - Channel name
   * @param {number} port - Port number
   * @returns {Object} Result
   */
  setChannelPort(name, port) {
    const channel = this.channelManager.getChannel(name);
    if (!channel) {
      return { status: "error", message: "Channel not found" };
    }
    
    channel.setPort(port);
    return { status: "ok" };
  }

  /**
   * Set channel device
   * @param {string} name - Channel name
   * @param {string} deviceName - Device name
   * @returns {Object} Result
   */
  setChannelDevice(name, deviceName) {
    const channel = this.channelManager.getChannel(name);
    const device = this.deviceManager.getDevice(deviceName);
    
    if (!channel) {
      return { status: "error", message: "Channel not found" };
    }
    if (!device) {
      return { status: "error", message: "Device not found" };
    }
    
    channel.setDevice(device);
    return { status: "ok" };
  }
}

export default ChannelService;
