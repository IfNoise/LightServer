// Description: ModbusDevice model to interact with modbus devices.
const modbus = require("jsmodbus");
const net = require("net");
const SerialPort = require("serialport");

class ModbusDevice {
  constructor(name, address, port = "502", timeout = 1000, type = "tcp", baudRate = 9600, dataBits = 8, stopBits = 1, parity = "none", unitId = 1) {
    this.name = name;
    this.type = type; // "tcp" or "rtu"
    this.unitId = unitId; // Modbus slave ID for RTU
    
    if (type === "rtu") {
      this.options = { 
        name: name, 
        path: address, // Serial port path (e.g., /dev/ttyUSB0, COM1)
        baudRate: baudRate,
        dataBits: dataBits,
        stopBits: stopBits,
        parity: parity,
        timeout: timeout
      };
    } else {
      this.options = { 
        name: name, 
        host: address, 
        port: port, 
        timeout: timeout 
      };
    }
    
    this.ports = null;
    this.timer = null;
    this.serialPort = null;
    this.client = null;
  }
  init(){
    if (this.type === "rtu") {
      this.initRTU();
    } else {
      this.initTCP();
    }
  }
  
  initTCP() {
    this.requestState().then((ports)=>{
      this.ports=ports;
    })
    this.timer=setInterval(()=>{
      this.requestState().then((ports)=>{
        this.ports=ports;
      })
    },30000) 
  }
  
  initRTU() {
    try {
      this.serialPort = new SerialPort(this.options.path, {
        baudRate: this.options.baudRate,
        dataBits: this.options.dataBits,
        stopBits: this.options.stopBits,
        parity: this.options.parity
      });
      
      this.client = new modbus.client.RTU(this.serialPort, this.unitId);
      
      this.serialPort.on('open', () => {
        console.log(`Serial port ${this.options.path} opened for ${this.name}`);
        this.requestState().then((ports)=>{
          this.ports=ports;
        })
        this.timer=setInterval(()=>{
          this.requestState().then((ports)=>{
            this.ports=ports;
          })
        },30000)
      });
      
      this.serialPort.on('error', (err) => {
        console.error(`Serial port error for ${this.name}:`, err);
      });
    } catch (e) {
      console.error(`Failed to initialize RTU device ${this.name}:`, e);
    }
  }
  requestState() {
        if (this.type === "rtu") {
          return this.requestStateRTU();
        } else {
          return this.requestStateTCP();
        }
      }
      
  requestStateTCP() {
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
      
  requestStateRTU() {
        return new Promise((resolve, reject) => {
          try {
            if (!this.client || !this.serialPort || !this.serialPort.isOpen) {
              reject([]);
              return;
            }
            
            this.client
              .readHoldingRegisters(0, 8)
              .then((resp) => {
                this.ports = resp.response._body.valuesAsArray;
                resolve([...this.ports]);
              })
              .catch((error) => {
                console.log(error);
                reject([]);
              });
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
      if (this.type === "rtu") {
        return this.updatePortsRTU(newState);
      } else {
        return this.updatePortsTCP(newState);
      }
  }
  
  updatePortsTCP(newState) {
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
  
  updatePortsRTU(newState) {
      return new Promise((resolve, reject) => {
        try {
          if (!this.client || !this.serialPort || !this.serialPort.isOpen) {
            reject([]);
            return;
          }
          
          this.client
            .writeMultipleRegisters(0, newState)
            .then((resp) => {
              resolve(resp.response._body.valuesAsArray);
            })
            .catch(() => {
              reject([]);
            });
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
      if (this.type === "rtu") {
        return this.updatePortRTU(port, newState);
      } else {
        return this.updatePortTCP(port, newState);
      }
  }
  
  updatePortTCP(port, newState) {
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
    
  updatePortRTU(port, newState) {
      return new Promise((resolve, reject) => {
        try {
          if (!this.client || !this.serialPort || !this.serialPort.isOpen) {
            reject([]);
            return;
          }
          
          this.client
            .writeSingleRegister(port, newState)
            .then((resp) => {
              resolve(resp.response._body);
            })
            .catch(() => {
              reject([]);
            });
        } catch (e) {
          console.log(e);
          reject([]);
        }
      });
    } 
  
  portState(port) {
    if (this.type === "rtu") {
      return this.portStateRTU(port);
    } else {
      return this.portStateTCP(port);
    }
  }
  
  portStateTCP(port) {
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
  
  portStateRTU(port) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.client || !this.serialPort || !this.serialPort.isOpen) {
          reject([]);
          return;
        }
        
        this.client
          .readHoldingRegisters(port, 1)
          .then((resp) => {
            resolve(resp.response._body.valuesAsArray);
          })
          .catch(() => {
            reject([]);
          });
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
