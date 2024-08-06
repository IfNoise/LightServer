const LocalStorage = require('node-localstorage').LocalStorage;
const LightChannel = require('./LightChannel');

class ChannelsManager {
  static instance = null;
  constructor(deviceManager) {
    this.channels = [];
    this.localStorage = new LocalStorage('./storage/channels');
    this.deviceManager = deviceManager;
  }

  static getInstance(deviceManager) {
    if (!ChannelsManager.instance) {
      ChannelsManager.instance = new ChannelsManager(deviceManager);
    }
    return ChannelsManager.instance;
  }
  
  loadChannels() {
    const channels = JSON.parse(this.localStorage.getItem('channels'));
    if (channels?.length>0) {
      this.channels = [];
      channels.forEach((channel) => {
        this.addChannel({name:channel.name,device:channel.device,port:channel.port});
      });
    }
  }

  saveChannels() {
    const out =this.channels.map((channel) => {
      return channel.json();
    } )
    this.localStorage.setItem('channels', JSON.stringify(out));
  }

  init(){
    if(JSON.parse(this.localStorage.getItem('channels'))?.length>0){
      this.loadChannels();
    }
  }
  addChannel(channel) {
    const device=this.deviceManager.getDevice(channel.device);
    const newChannel = new LightChannel(channel.name,device, channel.port);
    newChannel.init()
    this.channels.push(newChannel);
    this.saveChannels();
  }

  removeChannel(name) {
    this.channels = this.channels.filter((c) => c.name !== name);
    this.saveChannels();
  }

  getChannels() {
    return this.channels;
  }
  getChannelsJSON() {
    return this.channels.map((channel) => {
      return channel.json()
    }
    );
  }
  getChannel(name) {
    return this.channels.find((c) => c.name === name);
  }

  async getChannelState(name) {
    const channel = this.channels.find((c) => c.name === name);

    if (channel) {

      return channel.getState();
    } else {
      return { status: 'error' };
    }
  }
}

module.exports = ChannelsManager;