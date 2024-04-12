
const modbus = require("jsmodbus");
const net = require("net");

class ModbusDevice {
  constructor (name=null, address=null,port="502",timeout=1000) {
    this.name = name;
    this.options={name:name,host:address,port:port,timeout:timeout}
    this.ports=[];
  }
  
  requestState() {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const client = new modbus.client.TCP(socket);
      socket.on("connect", function () {
        client
          .readHoldingRegisters(0, 8)
          .then(function (resp) {
            this.ports. resp.response._body.valuesAsArray;
            resolve(this.ports);
            socket.end();
          })
          .catch(function (error) {
            reject([]);
            socket.end();
          });
      });
      socket.connect(this.options);
    });
  }
  updatePorts(newState) {
    return new Promise((resolve, reject) => {
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
    });
  }
  updatePort(port, newState) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const client = new modbus.client.TCP(socket);
      socket.on("connect", function () {
        client
          .writeSingleRegister(port, newState)
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
    });
  }
  portState(port) {
    return new Promise((resolve, reject) => {
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
            reject([]);
            socket.end();
          });
      });
      socket.connect(this.options);
    });
  }
}
// const socket = new net.Socket();
  // const client = new modbus.client.TCP(socket);
  // socket.on("connect", function () {
  //   client
  //     .readHoldingRegisters(0, 8)
  //     .then(function (resp) {
  //       //res.json({state:resp.response._body.valuesAsArray})
  //       socket.end();
  //     })
  //     .catch(function () {
  //       res.json({ state: [] });
  //       socket.end();
  //     });
  // });
  // socket.connect(options);
  module.exports = ModbusDevice;