const LocalStorage = require('node-localstorage').LocalStorage;
const ModbusDevice = require('./ModbusDevice');

class DeviceManager {
  static instance = null;
  constructor() {
    this.devices = [];
    this.localStorage = new LocalStorage('./storage/devices');
  }
  static getInstance() {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }
  loadDevices() {
    const devices = JSON.parse(this.localStorage.getItem('devices'));
    console.log("Saved Devices",devices)
    if (devices?.lenght>0){
      this.devices=[];
      devices.forEach((device) => {
        this.addDevice(device.name,device.options);
      })}
      console.log("Loaded Devices",this.devices)
  }
  saveDevices() {
    const tempDevices=this.devices.map((device)=>{
      return {name:device.name,options:device.options}
    }
    )
    this.localStorage.setItem('devices',JSON.stringify( tempDevices));
  }
  init() {
    this.loadDevices();

  }
  addDevice(name,options) {
    const device = new ModbusDevice(name,options.host,options.port);
    device.init();
    this.devices.push(device);
    this.saveDevices();
  }
  removeDevice(device) {
    this.devices = this.devices.filter((d) => d.name !== device.name);
    this.saveDevices();
  }
  getDevice(name) {
    const device = this.devices.find((d) => d.name === name);

    if (device) {
      return device;
    } else {
      return null;
    }
    
  }
  getDevices() {
    const devices =this.devices.map((device) => {
    const {name, options, ports } = device
      return {name, options, ports };
    })
    return devices;
  }

}
module.exports = DeviceManager;