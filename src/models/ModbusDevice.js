// Description: ModbusDevice model to interact with modbus devices.
import modbus from "jsmodbus";
import net from "net";
import { SerialPort } from "serialport";
import logger from "../config/logger.js";

class ModbusDevice {
  constructor(
    name,
    address,
    port,
    timeout = 1000,
    type = "rtu",
    baudRate = 9600,
    dataBits = 8,
    stopBits = 1,
    parity = "none",
    unitId = 1,
    portsCount = 8,
  ) {
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
        timeout: timeout,
      };
      // Для RTU устройств инициализируем массив портов нулями сразу
      this.ports = new Array(portsCount).fill(0);
    } else {
      this.options = {
        name: name,
        host: address,
        port: port,
        timeout: timeout,
      };
      this.ports = null;
    }

    this.timer = null;
    this.serialPort = null;
    this.client = null;
    this._reconnectTimer = null;
    this._reconnectAttempts = 0;
    this._baseReconnectDelay = 1000;
    this._maxReconnectDelay = 30000;
  }
  init() {
    if (this.type === "rtu") {
      this.initRTU();
    } else {
      this.initTCP();
    }
  }

  initTCP() {
    this.requestState().then((ports) => {
      this.ports = ports;
    });
    this.timer = setInterval(() => {
      this.requestState().then((ports) => {
        this.ports = ports;
      });
    }, 30000);
  }

  initRTU() {
    try {
      this.serialPort = new SerialPort({
        path: this.options.path,
        baudRate: this.options.baudRate,
        dataBits: this.options.dataBits,
        stopBits: this.options.stopBits,
        parity: this.options.parity,
      });

      this.client = new modbus.client.RTU(this.serialPort, this.unitId);

      this.serialPort.on("open", () => {
        logger.info(`Serial port opened`, {
          device: this.name,
          path: this.options.path,
        });
        this._reconnectAttempts = 0;
        if (this._reconnectTimer) {
          clearTimeout(this._reconnectTimer);
          this._reconnectTimer = null;
        }
      });

      this.serialPort.on("close", () => {
        logger.warn(`Serial port closed, scheduling reconnect`, {
          device: this.name,
          path: this.options.path,
        });
        this._scheduleReconnect();
      });

      this.serialPort.on("error", (err) => {
        logger.error(`Serial port error`, {
          device: this.name,
          error: err.message,
        });
        if (!this.serialPort.isOpen) {
          this._scheduleReconnect();
        }
      });
    } catch (e) {
      logger.error(`Failed to initialize RTU device`, {
        device: this.name,
        error: e.message,
      });
    }
  }

  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    const delay = Math.min(
      this._baseReconnectDelay * Math.pow(2, this._reconnectAttempts),
      this._maxReconnectDelay,
    );
    this._reconnectAttempts++;
    logger.info(
      `Scheduling reconnect attempt ${this._reconnectAttempts} in ${delay}ms`,
      { device: this.name, path: this.options.path },
    );
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._doReconnect();
    }, delay);
  }

  _doReconnect() {
    if (!this.serialPort) return;
    if (this.serialPort.isOpen) {
      this._reconnectAttempts = 0;
      return;
    }
    logger.info(`Attempting to reopen serial port`, {
      device: this.name,
      path: this.options.path,
      attempt: this._reconnectAttempts,
    });
    this.serialPort.open((err) => {
      if (err) {
        logger.error(`Serial port reopen failed`, {
          device: this.name,
          error: err.message,
        });
        this._scheduleReconnect();
      }
      // On success, 'open' event fires and resets _reconnectAttempts
    });
  }

  requestState() {
    if (this.type === "rtu") {
      return this.requestStateRTU();
    } else {
      return this.requestStateTCP();
    }
  }

  requestStateTCP() {
    return new Promise((resolve, reject) => {
      try {
        const socket = new net.Socket();
        const client = new modbus.client.TCP(socket);
        socket.on("connect", () => {
          client
            .readHoldingRegisters(0, 8)
            .then((resp) => {
              this.ports = resp.response._body.valuesAsArray;
              resolve([...this.ports]);
              socket.end();
            })
            .catch(function (error) {
              logger.error("Failed to read TCP holding registers", {
                error: error.message,
              });
              reject([]);
              socket.end();
            });
        });
        socket.connect(this.options);
      } catch (e) {
        logger.error("TCP requestState error", {
          device: this.name,
          error: e.message,
        });
        reject([]);
      }
    }).catch((e) => {
      logger.error("TCP requestState catch error", {
        device: this.name,
        error: e.message,
      });
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
            logger.error("Failed to read RTU holding registers", {
              device: this.name,
              error: error.message,
            });
            // При ошибке возвращаем текущее состояние
            resolve([...this.ports]);
          });
      } catch (e) {
        logger.error("RTU requestState error", {
          device: this.name,
          error: e.message,
        });
        resolve([...this.ports]);
      }
    }).catch((e) => {
      logger.error("RTU requestState catch error", {
        device: this.name,
        error: e.message,
      });
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
        logger.error("TCP updatePorts error", {
          device: this.name,
          error: e.message,
        });
        reject([]);
      }
    }).catch((e) => {
      logger.error("TCP updatePorts catch error", {
        device: this.name,
        error: e.message,
      });
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
        logger.error("RTU updatePorts error", {
          device: this.name,
          error: e.message,
        });
        reject([]);
      }
    }).catch((e) => {
      logger.error("RTU updatePorts catch error", {
        device: this.name,
        error: e.message,
      });
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
        logger.debug(`TCP updatePort`, {
          device: this.name,
          port,
          value: newState,
        });
        const socket = new net.Socket();
        const client = new modbus.client.TCP(socket);

        socket.on("error", (err) => {
          logger.error(`TCP socket error`, {
            device: this.name,
            error: err.message,
          });
          reject(err);
        });

        socket.on("connect", () => {
          logger.debug(`TCP connected, writing register`, {
            device: this.name,
          });
          client
            .writeSingleRegister(port, newState)
            .then((resp) => {
              logger.debug(`TCP write success`, {
                device: this.name,
                response: resp.response._body,
              });
              resolve(resp.response._body);
              socket.end();
            })
            .catch((err) => {
              logger.error(`TCP write failed`, {
                device: this.name,
                error: err.message,
              });
              reject(err);
              socket.end();
            });
        });
        socket.connect(this.options);
      } catch (e) {
        logger.error(`TCP exception`, { device: this.name, error: e.message });
        reject(e);
      }
    }).catch((e) => {
      logger.error(`TCP updatePort final error`, {
        device: this.name,
        error: e.message,
      });
      throw e;
    });
  }

  updatePortRTU(port, newState) {
    const maxRetries = 3;
    const baseDelay = 1000;

    const attempt = (retriesLeft, delay) => {
      return new Promise((resolve, reject) => {
        if (!this.client || !this.serialPort) {
          reject(new Error("RTU client not initialized"));
          return;
        }

        if (!this.serialPort.isOpen) {
          if (retriesLeft <= 0) {
            reject(new Error(`Serial port ${this.options.path} is not open`));
            return;
          }
          logger.warn(`Serial port not open, retrying in ${delay}ms`, {
            device: this.name,
            path: this.options.path,
            retriesLeft,
          });
          this._doReconnect();
          setTimeout(
            () =>
              attempt(retriesLeft - 1, Math.min(delay * 2, 5000))
                .then(resolve)
                .catch(reject),
            delay,
          );
          return;
        }

        this.client
          .writeSingleRegister(port, newState)
          .then((resp) => {
            this.ports[port] = newState;
            resolve(resp.response._body);
          })
          .catch((err) => {
            logger.error(`RTU write failed`, {
              device: this.name,
              error: err.message,
            });
            reject(err);
          });
      });
    };

    return attempt(maxRetries, baseDelay).catch((e) => {
      logger.error(`RTU updatePort final error`, {
        device: this.name,
        error: e.message,
      });
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
        logger.error("TCP portState error", {
          device: this.name,
          error: e.message,
        });
        reject([]);
      }
    }).catch((e) => {
      logger.error("TCP portState catch error", {
        device: this.name,
        error: e.message,
      });
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
        logger.error("RTU portState error", {
          device: this.name,
          error: e.message,
        });
        resolve([0]);
      }
    }).catch((e) => {
      logger.error("RTU portState catch error", {
        device: this.name,
        error: e.message,
      });
      return [];
    });
  }
}

export default ModbusDevice;
