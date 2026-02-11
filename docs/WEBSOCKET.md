# WebSocket API для трансляции состояния каналов

## Обзор

WebSocket API позволяет клиентам получать обновления состояния каналов освещения в реальном времени.

## Подключение

### Endpoint
```
ws://localhost:3001/ws/channels
```

**Примечание:** WebSocket работает на отдельном порту (по умолчанию 3001), который можно настроить через переменную окружения `WS_PORT`.

### Пример подключения (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:3001/ws/channels');

ws.onopen = () => {
  console.log('Подключено к серверу');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Получено сообщение:', data);
  
  switch(data.type) {
    case 'connected':
      console.log('Успешное подключение');
      break;
    case 'channel_update':
      console.log('Обновление канала:', data.channel, data.state);
      break;
    case 'channel_added':
      console.log('Добавлен новый канал:', data.channel);
      break;
    case 'channel_removed':
      console.log('Канал удален:', data.channel);
      break;
    case 'channels_state':
      console.log('Полное состояние каналов:', data.channels);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket ошибка:', error);
};

ws.onclose = () => {
  console.log('Соединение закрыто');
};
```

## Типы сообщений от сервера

### 1. Connected (приветственное сообщение)
Отправляется сразу после установки соединения.

```json
{
  "type": "connected",
  "message": "Connected to LightServer channels stream",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### 2. Channel Update (обновление состояния канала)
Отправляется когда изменяется состояние канала (яркость, уровни и т.д.).

```json
{
  "type": "channel_update",
  "channel": "channel_name",
  "state": {
    "name": "channel_name",
    "level": 150,
    "currentPercentage": 75,
    "maxLevel": 200,
    "minLevel": 0,
    "manual": true,
    "device": "device_name",
    "port": 1
  },
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### 3. Channel Added (добавление нового канала)
Отправляется когда создается новый канал.

```json
{
  "type": "channel_added",
  "channel": {
    "name": "new_channel",
    "device": "device_name",
    "port": 2,
    "maxLevel": 200,
    "minLevel": 0,
    "manual": true
  },
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### 4. Channel Removed (удаление канала)
Отправляется когда канал удаляется.

```json
{
  "type": "channel_removed",
  "channel": "removed_channel_name",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### 5. Channels State (полное состояние всех каналов)
Может быть отправлено для синхронизации полного состояния.

```json
{
  "type": "channels_state",
  "channels": [
    {
      "name": "channel1",
      "device": "device1",
      "port": 1,
      "maxLevel": 200,
      "minLevel": 0,
      "manual": true
    },
    {
      "name": "channel2",
      "device": "device1",
      "port": 2,
      "maxLevel": 150,
      "minLevel": 10,
      "manual": false
    }
  ],
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

## Сообщения от клиента

### Ping/Pong
Клиент может отправить ping для проверки соединения:

```javascript
ws.send(JSON.stringify({ type: 'ping' }));
```

Ответ от сервера:
```json
{
  "type": "pong",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

## Пример использования с React

```javascript
import { useEffect, useState } from 'react';

function ChannelsMonitor() {
  const [channels, setChannels] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws/channels');

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket подключен');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch(data.type) {
        case 'channel_update':
          setChannels(prev => ({
            ...prev,
            [data.channel]: data.state
          }));
          break;
        case 'channel_added':
          setChannels(prev => ({
            ...prev,
            [data.channel.name]: data.channel
          }));
          break;
        case 'channel_removed':
          setChannels(prev => {
            const newChannels = { ...prev };
            delete newChannels[data.channel];
            return newChannels;
          });
          break;
        case 'channels_state':
          const channelsObj = {};
          data.channels.forEach(ch => {
            channelsObj[ch.name] = ch;
          });
          setChannels(channelsObj);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket закрыт');
      setConnected(false);
    };

    // Cleanup при размонтировании
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h2>Состояние соединения: {connected ? '✅ Подключено' : '❌ Отключено'}</h2>
      <h3>Каналы:</h3>
      <ul>
        {Object.entries(channels).map(([name, state]) => (
          <li key={name}>
            {name}: {state.currentPercentage}% (уровень: {state.level})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChannelsMonitor;
```

## Технические детали

- **Протокол**: WebSocket (ws://)
- **Порт**: 3001 (по умолчанию, настраивается через `WS_PORT`)
- **Путь**: `/ws/channels`
- **Формат данных**: JSON
- **Автоматическое переподключение**: Не реализовано на сервере, должно быть реализовано на клиенте

## События, вызывающие обновления

WebSocket уведомления отправляются автоматически при следующих событиях:

1. Изменение яркости канала (`setPersentage`)
2. Изменение максимального уровня (`setMaxLevel`)
3. Изменение минимального уровня (`setMinLevel`)
4. Добавление нового канала
5. Удаление канала

## Безопасность

⚠️ **Важно**: Текущая реализация не включает аутентификацию или авторизацию. Для продакшн-среды рекомендуется добавить:

- Аутентификацию через токены
- CORS ограничения
- Поддержку WSS (WebSocket Secure) для шифрования данных
- Rate limiting для предотвращения злоупотреблений

## Мониторинг

Для мониторинга WebSocket соединений можно использовать:

```javascript
// Получить количество подключенных клиентов (на сервере)
const clientCount = wsService.getClientCount();
console.log(`Подключено клиентов: ${clientCount}`);
```

Логи WebSocket событий записываются через Winston logger с метками:
- `info`: подключение/отключение клиентов
- `debug`: отправка сообщений broadcast
- `error`: ошибки соединения или отправки сообщений
