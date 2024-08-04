const LocalStorage = require('node-localstorage').LocalStorage;

class LightChannel {
  constructor(name, device, port) {
    this.name = name;
    this.device = device;
    this.port = port;
    this.maxLevel=0; 
    this.level=0;
    this.nightMode=true;
    this.localStorage = new LocalStorage('./storage/channels/'+name);
  }
  init() {
    this.maxLevel=parseInt(this.localStorage.getItem("maxLevel"))||0;
  }
  setMaxLevel(maxLevel){
    this.maxLevel=maxLevel*32767/100;
    this.localStorage.setItem("maxLevel",this.maxLevel)
  }
  async setPersentage(persentage){
    const newLevel=Math.floor(this.maxLevel*persentage/100);
    if(newLevel==this.level){
      return;
    }
    this.level=newLevel;
    console.log("Timer",this.name,"set level",this.level)
    const res=await this.device.updatePort(this.port,this.level);
    if(res){
      console.log("Port",this.port,"set to",this.level)
      console.log("res",res)
    }
  }
  json(){
    return {name:this.name,device:this.device.name,port:this.port,maxLevel:this.maxLevel};
  } 
  async getState(){
    let state
    if(this.device){
      const ports=await this.device.requestState()
      state=ports[this.port];
  
    }else{
      state=0;
    }
    return state;
  }
}

module.exports = LightChannel;
