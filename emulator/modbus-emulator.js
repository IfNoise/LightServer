/**
 * Modbus TCP Device Emulator
 *
 * Эмулирует Modbus TCP устройство с 8 holding registers.
 * Используется для разработки и тестирования без реального оборудования.
 *
 * Регистры:
 *   0-7 — состояние каналов (0 = выкл, 1 = вкл, или 0-65535 для диммера)
 *
 * Переменные окружения:
 *   EMULATOR_PORT  — TCP порт (default: 5020)
 *   EMULATOR_HOST  — адрес для прослушивания (default: 0.0.0.0)
 *   LOG_LEVEL      — уровень логирования (default: info)
 */

import "dotenv/config";
import net from "net";
import modbus from "jsmodbus";

const PORT = parseInt(process.env.EMULATOR_PORT || "5020", 10);
const HOST = process.env.EMULATOR_HOST || "0.0.0.0";
const REGISTER_COUNT = 8;

// Holding registers: REGISTER_COUNT * 2 bytes (big-endian uint16)
const holdingBuffer = Buffer.alloc(REGISTER_COUNT * 2, 0);

function getRegisters() {
  const registers = [];
  for (let i = 0; i < REGISTER_COUNT; i++) {
    registers.push(holdingBuffer.readUInt16BE(i * 2));
  }
  return registers;
}

function printState(event) {
  const regs = getRegisters();
  const now = new Date().toISOString();
  const row = regs.map((v, i) => `R${i}=${v}`).join("  ");
  console.log(`[${now}] [${event}] ${row}`);
}

// Перехватываем запись в буфер через Proxy для логирования
const bufferProxy = new Proxy(holdingBuffer, {
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
});

const netServer = new net.Server();

// jsmodbus TCP server
const modbusServer = new modbus.server.TCP(netServer, {
  holding: holdingBuffer,
});

modbusServer.on("connection", (client) => {
  const addr = client.socket
    ? `${client.socket.remoteAddress}:${client.socket.remotePort}`
    : "unknown";
  console.log(`[${new Date().toISOString()}] [CONNECT] client=${addr}`);
});

modbusServer.on("readHoldingRegisters", (request, response) => {
  printState(`READ  addr=${request.address} qty=${request.quantity}`);
});

modbusServer.on("writeMultipleRegisters", (request, response) => {
  // Данные уже записаны в holdingBuffer к моменту события
  printState(
    `WRITE addr=${request.address} qty=${request.quantity} values=[${request.values.join(",")}]`,
  );
});

modbusServer.on("writeSingleRegister", (request, response) => {
  printState(`WRITE addr=${request.address} value=${request.value}`);
});

modbusServer.on("error", (err) => {
  console.error(`[${new Date().toISOString()}] [ERROR] ${err.message}`);
});

netServer.listen(PORT, HOST, () => {
  console.log(`\n=== Modbus TCP Emulator ===`);
  console.log(`Listening on ${HOST}:${PORT}`);
  console.log(
    `Registers: ${REGISTER_COUNT} holding registers (addr 0-${REGISTER_COUNT - 1})`,
  );
  console.log(
    `Initial state: ${getRegisters()
      .map((v, i) => `R${i}=${v}`)
      .join("  ")}`,
  );
  console.log(`\nWaiting for connections...\n`);
});

netServer.on("error", (err) => {
  console.error(`[${new Date().toISOString()}] [SERVER ERROR] ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(
    `\n[${new Date().toISOString()}] [SHUTDOWN] Received ${signal}, closing server...`,
  );
  netServer.close(() => {
    console.log(`[${new Date().toISOString()}] [SHUTDOWN] Server closed.`);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
