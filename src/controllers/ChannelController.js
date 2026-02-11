import ChannelService from '../services/ChannelService.js';

const channelService = new ChannelService();

/**
 * Controller for handling light channel-related HTTP requests
 */
class ChannelController {
  /**
   * Get all channels
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getAllChannels(req, res) {
    try {
      const channels = channelService.getAllChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Get single channel
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static getChannel(req, res) {
    try {
      const { name } = req.params;
      const channel = channelService.getChannelByName(name);
      
      if (channel) {
        res.json(channel.json());
      } else {
        res.status(404).json({ status: "error", message: "Channel not found" });
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Create new channel
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static createChannel(req, res) {
    try {
      const { name, device, port } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ status: "error", message: "Channel name is required" });
      }
      if (!device) {
        return res.status(400).json({ status: "error", message: "Device name is required" });
      }
      if (port === undefined) {
        return res.status(400).json({ status: "error", message: "Port number is required" });
      }
      
      const result = channelService.createChannel({ name, device, port });
      
      if (result.status === "ok") {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Update channel (partial)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async updateChannel(req, res) {
    try {
      const { name } = req.params;
      const result = await channelService.updateChannel(name, req.body);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Replace channel (full update)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async replaceChannel(req, res) {
    try {
      const { name } = req.params;
      const { device, port, maxLevel, minLevel } = req.body;
      
      // Validate required fields
      if (!device) {
        return res.status(400).json({ status: "error", message: "Device name is required" });
      }
      if (port === undefined) {
        return res.status(400).json({ status: "error", message: "Port number is required" });
      }
      
      const result = await channelService.replaceChannel(name, { device, port, maxLevel, minLevel });
      
      if (result.status === "ok") {
        res.json(result);
      } else if (result.status === "error" && result.message === "Channel not found") {
        res.status(404).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Delete channel
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static deleteChannel(req, res) {
    try {
      const { name } = req.params;
      const result = channelService.deleteChannel(name);
      
      if (result.status === "ok") {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Get channel state
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async getChannelState(req, res) {
    try {
      const { name } = req.params;
      const result = await channelService.getChannelState(name);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Get all channels state
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async getAllChannelsState(req, res) {
    try {
      const result = await channelService.getAllChannelsState();
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Set channel max level (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static async setMaxLevel(req, res) {
    try {
      const { name } = req.params;
      const { maxLevel } = req.body;
      const result = await channelService.setChannelMaxLevel(name, maxLevel);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Set channel port (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static setPort(req, res) {
    try {
      const { name } = req.params;
      const { port } = req.body;
      const result = channelService.setChannelPort(name, port);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Set channel device (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static setDevice(req, res) {
    try {
      const { name } = req.params;
      const { device: deviceName } = req.body;
      const result = channelService.setChannelDevice(name, deviceName);
      
      if (result.status === "error") {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Add channel (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static addChannel(req, res) {
    try {
      const { name, device, port } = req.body;
      const result = channelService.createChannel({ name, device, port });
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  /**
   * Remove channel (legacy)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  static removeChannel(req, res) {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ status: "error", message: "Channel name is required" });
      }
      
      const result = channelService.deleteChannel(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}

export default ChannelController;
