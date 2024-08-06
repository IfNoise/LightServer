const Timer = require('./Timer');
const LocalStorage = require('node-localstorage').LocalStorage;

const removeElement = (array, element) => {
  let index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
  }
}
class TimerManager {
  static instance=null;
  constructor(channelManager) {
    if(TimerManager.instance){
      return TimerManager.instance;
    }
    TimerManager.instance=this;
    this.timers = [];
    this.channelManager = channelManager;
    this.localStorage = new LocalStorage('./storage/timers');
  }
  static getInstance(channelManager){
    if(!TimerManager.instance){
      TimerManager.instance=new TimerManager(channelManager);
    }
    return TimerManager.instance;
  }
  init(){
    this.loadTimers();
  }
  loadTimers() {
    const timers = JSON.parse(this.localStorage.getItem('timers')) ?? [];
    this.timers = timers.map((timer) => {
      const newTimer=new Timer(timer.name)
      newTimer.setSteps(timer.steps);
      newTimer.setStepTime(timer.stepTime);
      newTimer.setSunriseTime(timer.sunriseTime);
      newTimer.setSunsetTime(timer.sunsetTime);
      newTimer.state=timer.state;
      newTimer.init();
      return newTimer;
    });
    timers.forEach((timer,i) => {
      this.subscribe(timer.name,timer.channels);
    }

    );
  }

  saveTimers() {
    const output=this.timers.map((timer)=>timer.json());
    this.localStorage.setItem('timers', JSON.stringify(output));
  }

  addTimer(name,steps,stepTime,sunriseTime,sunsetTime) {
    const timer=new Timer(name);
    timer.setSteps(steps);
    timer.setStepTime(stepTime);
    timer.setSunriseTime(sunriseTime);
    timer.setSunsetTime(sunsetTime);
    timer.init();
    this.timers.push(timer);
    this.saveTimers();
  }

  removeTimer(timer) {
    this.timers = this.timers.filter(t => t.name !== timer);
    this.saveTimers();
  }
  getTimer(name) {
    return this.timers.find(t => t.name === name);
  }
  getTimers() {
    return this.timers.map(t => t.json());
  }
  subscribe(timer, channels) {
    const tmr=this.timers.find(t => t.name === timer);
    channels.forEach(channel => {
      let ch=this.channelManager.getChannel(channel);
      tmr.subscribe(ch);
    });
    this.saveTimers();
  }
  unsubscribe(timer, channels) {
    const tmr=this.timers.find(t => t.name === timer);
    channels.forEach(channel => {
      tmr.unsubscribe(channel);
    });
    this.saveTimers();
  }
} 

module.exports = TimerManager;

