import { WebSocketServer } from "ws";
import logger from "../config/logger.js";

class WebSocketService {
  static instance = null;

  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Инициализация WebSocket сервера
   * @param {Object} server - HTTP сервер
   * @param {number} port - Порт для запуска WebSocket сервера (опционально)
   */
  init(server, port = null) {
    this.wss = new WebSocketServer({ server });
    this.server = server;

    // Если передан порт, запускаем HTTP сервер
    if (port) {
      server.listen(port, () => {
        logger.info("WebSocket server listening", {
          port,
          path: "/ws/channels",
        });
      });
    }

    this.wss.on("connection", (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      logger.info("New WebSocket client connected", { clientIp });

      this.clients.add(ws);

      // Отправляем приветственное сообщение
      ws.send(
        JSON.stringify({
          type: "connected",
          message: "Connected to LightServer channels stream",
          timestamp: new Date().toISOString(),
        }),
      );

      // Обработка входящих сообщений от клиента
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          logger.debug("Received WebSocket message", { clientIp, data });

          // Можно добавить обработку команд от клиента
          if (data.type === "ping") {
            ws.send(
              JSON.stringify({
                type: "pong",
                timestamp: new Date().toISOString(),
              }),
            );
          }
        } catch (e) {
          logger.error("Failed to parse WebSocket message", {
            error: e.message,
          });
        }
      });

      // Обработка закрытия соединения
      ws.on("close", () => {
        logger.info("WebSocket client disconnected", { clientIp });
        this.clients.delete(ws);
      });

      // Обработка ошибок
      ws.on("error", (error) => {
        logger.error("WebSocket error", { clientIp, error: error.message });
        this.clients.delete(ws);
      });
    });

    logger.info("WebSocket server initialized", { path: "/ws/channels" });
  }

  /**
   * Отправка обновления состояния канала всем подключенным клиентам
   * @param {Object} data - Данные для отправки
   */
  broadcast(data) {
    if (!this.wss) {
      logger.warn("WebSocket server not initialized");
      return;
    }

    const message = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    });

    let sentCount = 0;
    let errorCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        try {
          client.send(message);
          sentCount++;
        } catch (e) {
          logger.error("Failed to send message to WebSocket client", {
            error: e.message,
          });
          errorCount++;
          this.clients.delete(client);
        }
      }
    });

    if (sentCount > 0) {
      logger.debug("Broadcast message sent", {
        sentCount,
        errorCount,
        type: data.type,
      });
    }
  }

  /**
   * Отправка обновления состояния канала
   * @param {string} channelName - Имя канала
   * @param {Object} state - Состояние канала
   */
  broadcastChannelUpdate(channelName, state) {
    this.broadcast({
      type: "channel_update",
      channel: channelName,
      state,
    });
  }

  /**
   * Отправка добавления нового канала
   * @param {Object} channel - Данные канала
   */
  broadcastChannelAdded(channel) {
    this.broadcast({
      type: "channel_added",
      channel,
    });
  }

  /**
   * Отправка удаления канала
   * @param {string} channelName - Имя удаленного канала
   */
  broadcastChannelRemoved(channelName) {
    this.broadcast({
      type: "channel_removed",
      channel: channelName,
    });
  }

  /**
   * Отправка полного состояния всех каналов
   * @param {Array} channels - Массив каналов
   */
  broadcastAllChannels(channels) {
    this.broadcast({
      type: "channels_state",
      channels,
    });
  }

  /**
   * Получение количества подключенных клиентов
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Закрытие всех соединений и остановка сервера
   */
  shutdown() {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.close(1000, "Server shutdown");
      });
      this.wss.close(() => {
        logger.info("WebSocket server closed");
      });
    }
  }
}

export default WebSocketService;
