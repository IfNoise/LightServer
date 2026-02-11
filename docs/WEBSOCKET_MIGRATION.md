# Миграция WebSocket на отдельный порт

## Изменения

WebSocket сервер теперь работает на **отдельном порту** (по умолчанию **3001**) вместо того же порта, что и REST API.

### Что изменилось

**Раньше:**

- WebSocket: `ws://localhost:3000/api/ws/channels`
- REST API: `http://localhost:3000/api`

**Теперь:**

- WebSocket: `ws://localhost:3001/ws/channels`
- REST API: `http://localhost:3000/api`

### Преимущества

1. **Масштабируемость** - WebSocket и HTTP трафик разделены
2. **Надежность** - проблемы с WebSocket не влияют на REST API
3. **Гибкость** - можно независимо настраивать порты и масштабировать серверы

## Что нужно сделать

### 1. Обновить переменные окружения

Добавьте в ваш `.env` файл:

```env
PORT=3000      # HTTP сервер (REST API)
WS_PORT=3001   # WebSocket сервер
```

### 2. Обновить клиентский код

**JavaScript:**

```javascript
// Старый код
const ws = new WebSocket("ws://localhost:3000/api/ws/channels");

// Новый код
const ws = new WebSocket("ws://localhost:3001/ws/channels");
```

**React:**

```javascript
// Обновить константу с URL
const WS_URL = "ws://localhost:3001/ws/channels";
```

### 3. Обновить файрвол / прокси

Если вы используете nginx или другой прокси-сервер, обновите конфигурацию:

**nginx пример:**

```nginx
# REST API
location /api {
    proxy_pass http://localhost:3000;
}

# WebSocket
location /ws {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### 4. Docker / Docker Compose

Если вы используете Docker, обновите маппинг портов:

```yaml
services:
  lightserver:
    ports:
      - "3000:3000" # REST API
      - "3001:3001" # WebSocket
    environment:
      - PORT=3000
      - WS_PORT=3001
```

## Тестирование

1. Запустите сервер:

   ```bash
   npm run dev
   ```

2. Убедитесь, что оба порта запущены:

   ```
   2026-02-11 19:41:37 [info]: Server app listening at 3000 port
   2026-02-11 19:41:37 [info]: WebSocket server listening {"port":3001,"path":"/ws/channels"}
   ```

3. Откройте тестовый клиент в браузере:

   ```
   file:///path/to/docs/websocket-test-client.html
   ```

4. Проверьте подключение к `ws://localhost:3001/ws/channels`

## Обратная совместимость

Если вам необходимо оставить WebSocket на том же порту, что и REST API, вы можете установить `WS_PORT` равным `PORT`:

```env
PORT=3000
WS_PORT=3000
```

В этом случае путь останется: `ws://localhost:3000/ws/channels`

## Устранение проблем

### Ошибка "address already in use"

Если порт занят:

1. Проверьте, какой процесс использует порт:

   ```bash
   lsof -i :3001
   # или
   netstat -tulpn | grep 3001
   ```

2. Завершите процесс или выберите другой порт:
   ```env
   WS_PORT=3002
   ```

### WebSocket не подключается

1. Проверьте логи сервера на наличие ошибок
2. Убедитесь, что используете правильный URL
3. Проверьте файрвол / прокси настройки
4. Используйте тестовый клиент для диагностики

## Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Используйте [docs/websocket-test-client.html](websocket-test-client.html) для тестирования
3. Обратитесь к [docs/WEBSOCKET.md](WEBSOCKET.md) за подробной документацией
