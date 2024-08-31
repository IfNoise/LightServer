const e = require("express");

const LocalStorage = require("node-localstorage").LocalStorage;

//remove element from array utility function
const removeElement = (array, element) => {
  let index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
  }
};
//Timer class
class Timer {
  constructor(name) {
    this.name = name;
    this.state = "stopped";
    this.steps = 8; //number of steps
    this.stepTime = 10; //time of one step
    this.channels = []; //array of channels
    this.sunriseTime = null;
    this.sunsetTime = null;
    this.timer = null;
    this.localStorage = new LocalStorage(`./storage/${this.name}`);
  }

  init() {
    this.steps = parseInt(this.localStorage.getItem("steps")) || 8;
    this.stepTime = parseInt(this.localStorage.getItem("stepTime")) || 10;
    this.sunriseTime = parseInt(this.localStorage.getItem("sunriseTime")) || 0;
    this.sunsetTime = parseInt(this.localStorage.getItem("sunsetTime")) || 1440;
    this.state = this.localStorage.getItem("state") || "stopped";
    if (this.state === "started") {
      this.start();
    }
  }
  //get subscribed channels
  getChannels() {
    return this.channels.map((ch) => {
      return ch.name;
    });
  }
  //set number of steps
  setSteps(steps) {
    //set number of steps
    this.steps = steps;
    this.localStorage.setItem("steps", steps);
  }
  //set time of one step
  setStepTime(time) {
    //set time of one step
    this.stepTime = time;
    this.localStorage.setItem("stepTime", time);
  }
  //set sunrise time
  setSunriseTime(time) {
    //set sunrise time
    this.sunriseTime = time;
    this.localStorage.setItem("sunriseTime", time);
  }
  //set sunset time
  setSunsetTime(time) {
    //set sunset time
    this.sunsetTime = time;
    this.localStorage.setItem("sunsetTime", time);
  }
  //subscribe to timer
  subscribe(channel) {
    if (channel && !this.channels.includes(channel)) {
      this.channels.push(channel);
    }
  }
  //unsubscribe from timer
  unsubscribe(channel) {
    if (channel && this.channels.includes(channel)) {
      removeElement(this.channels, channel);
    }
  }
  //calculate state of channels
  calcState(timer) {
    const now = new Date(); //get current time
    const time = now.getHours() * 60 + now.getMinutes(); //convert time to minutes
    const steps = timer.steps + 1;
    if (timer.sunriseTime < timer.sunsetTime) {
      //if sunrise is before sunset

      if (time < timer.sunriseTime || time > timer.sunsetTime) {
        //if time is before sunrise or after sunset
        timer.channels.forEach((ch) => {
          ch.setPersentage(0);
          ch.nightMode ? (ch.nightMode = true) : (ch.nightMode = false);
        });
      } else if (time < timer.sunriseTime + steps * timer.stepTime) {
        //if time is after sunrise
        const step = Math.floor((time - timer.sunriseTime) / timer.stepTime); //calculate step
        console.log("Time", now, "CalcStep", step);
        timer.channels.forEach((ch) => {
          ch.setPersentage((step / (steps-1)) * 100); //set persentage
        });
      } else if (time > timer.sunsetTime - steps * timer.stepTime) {
        //if time is after sunset
        const step = Math.floor((timer.sunsetTime - time) / timer.stepTime); //calculate step
        console.log("Time", now, "CalcStep", step);
        timer.channels.forEach((ch) => {
          ch.setPersentage((step / (steps - 1)) * 100); //set persentage
        });
      }else{
        timer.channels.forEach((ch) => {
          ch.setPersentage(100);
          ch.nightMode ? (ch.nightMode =false) : (ch.nightMode = true);
        });
      }
    } else {
      //if sunset is before sunrise
      if (time > timer.sunsetTime && time < timer.sunriseTime) {
        //if time is after sunset and before sunrise
        timer.channels.forEach((ch) => {
          ch.setPersentage(0);
          ch.nightMode ? (ch.nightMode = true) : (ch.nightMode = false);
        });
      } else if (time < timer.sunriseTime + steps * timer.stepTime) {
        //if time is after sunrise
        const step = Math.floor((time - timer.sunriseTime) / timer.stepTime); //calculate step
        timer.channels.forEach((ch) => {
          const persent=(step / (steps-1)) * 100
          if(step==0||persent<10)ch.setPersentage(10);
          else
          ch.setPersentage(persent); //set persentage
        });
      } else if (time > timer.sunsetTime - steps * timer.stepTime) {
        //if time is after sunset
        const step = Math.floor((timer.sunsetTime - time) / timer.stepTime); //calculate step
        timer.channels.forEach((ch) => {
          const persent=(step / (steps-1)) * 100
          if(step==0||persent<10)ch.setPersentage(10);
          else ch.setPersentage(persent); //set persentage
        });
      }else{
        timer.channels.forEach((ch) => {
          ch.setPersentage(100);
          ch.nightMode ? (ch.nightMode =false) : (ch.nightMode = true);
        });
      }
    }
  }

  json() {
    const channels = this.getChannels();
    return {
      name: this.name,
      state: this.state,
      steps: this.steps,
      stepTime: this.stepTime,
      sunriseTime: this.sunriseTime,
      sunsetTime: this.sunsetTime,
      channels,
    };
  }
  start() {
    this.timer = setInterval(this.calcState, 10000, this);
    this.state = "started";
    console.log("Timer", this.name, "started");
    this.localStorage.setItem("state", "started");
  }
  stop() {
    clearInterval(this.timer);
    this.state = "stopped";
    console.log("Timer", this.name, "stopped");
    this.localStorage.setItem("state", "stopped");
  }
}
module.exports = Timer;
