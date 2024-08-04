// Description: ModbusDevice model to interact with modbus devices.
const modbus = require("jsmodbus");
const net = require("net");

class ModbusDevice {
  constructor(name, address , port = "502", timeout = 1000) {
    this.name = name;
    this.options = { name: name, host: address, port: port, timeout: timeout };
    this.ports = null;
    this.timer=null;
  }
  init(){
    this.requestState().then((ports)=>{
      this.ports=ports;
    })
    this.timer=setInterval(()=>{
      this.requestState().then((ports)=>{
        this.ports=ports;
      })
    },30000) 
  }
  requestState() {
        return  new Promise((resolve, reject) => {
          try {
            const socket = new net.Socket();
            const client = new modbus.client.TCP(socket);
            socket.on("connect", ()=>{
              client
                .readHoldingRegisters(0, 8)
                .then((resp)=>{
                  this.ports = resp.response._body.valuesAsArray;
                  resolve([...this.ports]);
                  socket.end();
                })
                .catch(function (error) {
                  console.log(error);
                  reject([]);
                  socket.end();
                });
            });
            socket.connect(this.options);
          } catch (e) {
            console.log(e);
            reject([]);
          }
        }).catch((e) => {
          console.log(e);
          return [];
        });
      } 
    
  
  updatePorts(newState) {
      return new Promise((resolve, reject) => {
        try {
          const socket = new net.Socket();
          const client = new modbus.client.TCP(socket);
          socket.on("connect", function () {
            client
              .writeMultipleRegisters(0, newState)
              .then(function (resp) {
                resolve(resp.response._body.valuesAsArray);
                socket.end();
              })
              .catch(function () {
                reject([]);
                socket.end();
              });
          });
          socket.connect(this.options);
        } catch (e) {
          console.log(e);
          reject([]);
        }
      }).catch((e) => {
        console.log(e);
        return [];
      });
  }
  updatePort(port, newState) {
      return new Promise((resolve, reject) => {
        try {
          const socket = new net.Socket();
          const client = new modbus.client.TCP(socket);
          socket.on("connect", function () {
            client
              .writeSingleRegister(port, newState)
              .then(function (resp) {
                resolve(resp.response._body);
                socket.end();
              })
              .catch(function () {
                reject([]);
                socket.end();
              });
          });
          socket.connect(this.options);
        } catch (e) {
          console.log(e);
          reject([]);
        }
      });
    } 
  
  portState(port) {
    return new Promise((resolve, reject) => {
      try {
        const socket = new net.Socket();
        const client = new modbus.client.TCP(socket);
        socket.on("connect", function () {
          client
            .readHoldingRegisters(port, 1)
            .then(function (resp) {
              resolve(resp.response._body.valuesAsArray);
              socket.end();
            })
            .catch(function () {
              
              socket.end();
              reject([]);
            });
        });
        socket.connect(this.options);
      } catch (e) {
        console.log(e);
        reject([]);
      }
    })
    .catch((e) => {
      console.log(e);
      return [];
    });
  }
}

module.exports = ModbusDevice;
