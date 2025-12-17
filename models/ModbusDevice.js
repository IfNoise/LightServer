// Description: ModbusDevice model to interact with modbus devices.
const modbus = require("jsmodbus");
const net = require("net");
const { SerialPort } = require("serialport");

class ModbusDevice {
  constructor(name, address, port, timeout = 1000, type = "rtu", baudRate = 9600, dataBits = 8, stopBits = 1, parity = "none", unitId = 1, portsCount = 8) {
    this.name = name;
    this.type = type; // "tcp" or "rtu"
    this.unitId = unitId; // Modbus slave ID for RTU
    this.portsCount = portsCount; // Number of ports/registers to read
    
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
      // Для RTU устройств инициализируем массив портов нулями сразу
      this.ports = new Array(portsCount).fill(0);
    } else {
      this.options = { 
        name: name, 
        host: address, 
        port: port, 
        timeout: timeout 
      };
      this.ports = null;
    }
    
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
      this.serialPort = new SerialPort({
        path: this.options.path,
        baudRate: this.options.baudRate,
        dataBits: this.options.dataBits,
        stopBits: this.options.stopBits,
        parity: this.options.parity
      });
      
      this.client = new modbus.client.RTU(this.serialPort, this.unitId);
      
      this.serialPort.on('open', () => {
        console.log(`Serial port ${this.options.path} opened for ${this.name}`);
        // Для RTU не делаем автоматический опрос состояния
        // Состояние управляется только через команды записи
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
              // Если порт не открыт, возвращаем текущее состояние из памяти
              resolve([...this.ports]);
              return;
            }
            
            this.client
              .readHoldingRegisters(0, this.portsCount)
              .then((resp) => {
                this.ports = resp.response._body.valuesAsArray;
                resolve([...this.ports]);
              })
              .catch((error) => {
                console.log(error);
                // При ошибке возвращаем текущее состояние
                resolve([...this.ports]);
              });
          } catch (e) {
            console.log(e);
            resolve([...this.ports]);
          }
        }).catch((e) => {
          console.log(e);
          return [...this.ports];
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
              // Обновляем локальное состояние после успешной записи
              this.ports = [...newState];
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
          console.log(`[ModbusDevice:${this.name}] TCP updatePort: port=${port}, value=${newState}`);
          const socket = new net.Socket();
          const client = new modbus.client.TCP(socket);
          
          socket.on("error", (err) => {
            console.error(`[ModbusDevice:${this.name}] TCP socket error:`, err);
            reject(err);
          });
          
          socket.on("connect", () => {
            console.log(`[ModbusDevice:${this.name}] TCP connected, writing register...`);
            client
              .writeSingleRegister(port, newState)
              .then((resp) => {
                console.log(`[ModbusDevice:${this.name}] TCP write success:`, resp.response._body);
                resolve(resp.response._body);
                socket.end();
              })
              .catch((err) => {
                console.error(`[ModbusDevice:${this.name}] TCP write failed:`, err);
                reject(err);
                socket.end();
              });
          });
          socket.connect(this.options);
        } catch (e) {
          console.error(`[ModbusDevice:${this.name}] TCP exception:`, e);
          reject(e);
        }
      }).catch((e) => {
        console.error(`[ModbusDevice:${this.name}] TCP updatePort final error:`, e);
        throw e;
      });
    }
    
  updatePortRTU(port, newState) {
      return new Promise((resolve, reject) => {
        try {
          if (!this.client) {
            const err = new Error("RTU client not initialized");
            console.error(`[ModbusDevice:${this.name}]`, err.message);
            reject(err);
            return;
          }
          
          if (!this.serialPort) {
            const err = new Error("Serial port not initialized");
            console.error(`[ModbusDevice:${this.name}]`, err.message);
            reject(err);
            return;
          }
          
          if (!this.serialPort.isOpen) {
            const err = new Error(`Serial port ${this.options.path} is not open`);
            console.error(`[ModbusDevice:${this.name}]`, err.message);
            reject(err);
            return;
          }
          
          this.client
            .writeSingleRegister(port, newState)
            .then((resp) => {
              // Обновляем локальное состояние после успешной записи
              this.ports[port] = newState;
              resolve(resp.response._body);
            })
            .catch((err) => {
              console.error(`[ModbusDevice:${this.name}] RTU write failed:`, err);
              reject(err);
            });
        } catch (e) {
          console.error(`[ModbusDevice:${this.name}] RTU exception:`, e);
          reject(e);
        }
      }).catch((e) => {
        console.error(`[ModbusDevice:${this.name}] RTU updatePort final error:`, e);
        throw e;
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
          // Если порт не открыт, возвращаем из локальной памяти
          if (this.ports && port < this.ports.length) {
            resolve([this.ports[port]]);
          } else {
            resolve([0]);
          }
          return;
        }
        
        this.client
          .readHoldingRegisters(port, 1)
          .then((resp) => {
            const value = resp.response._body.valuesAsArray[0];
            // Обновляем локальное состояние
            this.ports[port] = value;
            resolve([value]);
          })
          .catch(() => {
            // При ошибке возвращаем из локальной памяти
            if (this.ports && port < this.ports.length) {
              resolve([this.ports[port]]);
            } else {
              resolve([0]);
            }
          });
      } catch (e) {
        console.log(e);
        resolve([0]);
      }
    })
    .catch((e) => {
      console.log(e);
      return [];
    });
  }
}


module.exports = ModbusDevice;
