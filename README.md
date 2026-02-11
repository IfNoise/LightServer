# LightServer

Сервер управления освещением через Modbus TCP/RTU протокол.

## Возможности

- Поддержка Modbus TCP и RTU устройств
- Управление каналами освещения
- Система таймеров для автоматизации
- RESTful API для управления устройствами
- Сохранение конфигурации в локальном хранилище

## Установка

```bash
npm install
```

## Конфигурация

Приложение использует переменные среды для конфигурации. Скопируйте `.env.example` в `.env` и настройте значения:

```bash
cp .env.example .env
```

### Переменные среды

| Переменная | Описание | Значение по умолчанию |
|-----------|----------|----------------------|
| `PORT` | Порт HTTP сервера | `3000` |
| `STORAGE_DEVICES` | Путь к хранилищу устройств | `./storage/devices` |
| `STORAGE_CHANNELS` | Путь к хранилищу каналов | `./storage/channels` |
| `STORAGE_TIMERS` | Путь к хранилищу таймеров | `./storage/timers` |
| `LOG_LEVEL` | Уровень логирования (error, warn, info, debug) | `info` |
| `LOKI_HOST` | URL Grafana Loki для отправки логов (опционально) | - |

### Логирование

Приложение использует Winston для логирования с поддержкой Grafana Loki.

**Уровни логирования:**
- `error` - только ошибки
- `warn` - предупреждения и ошибки
- `info` - информационные сообщения (по умолчанию)
- `debug` - подробные логи для отладки

**Транспорты:**
- Console - вывод в консоль (всегда включен)
- File - файлы `logs/error.log` и `logs/combined.log` (только в production)
- Loki - отправка в Grafana Loki (если указан `LOKI_HOST`)

**Пример настройки Loki:**
```env
LOKI_HOST=http://localhost:3100
LOG_LEVEL=debug
```

**Использование в коде:**
```javascript
import logger from './config/logger.js';

logger.info('Server started', { port: 3000 });
logger.error('Connection failed', { error: err.message });
logger.debug('Processing request', { requestId: '123' });
```

## Запуск

### Разработка
```bash
npm run dev
```

### Production
```bash
npm start
```

### Тесты
```bash
npm test                # Запуск всех тестов
npm run test:watch      # Запуск в режиме watch
npm run test:coverage   # Запуск с отчетом о покрытии
```

## API

### Устройства

#### Получить список устройств
```
GET /api/devices
```

#### Получить устройство по имени
```
GET /api/devices/:name
```

#### Получить состояние устройства
```
GET /api/devices/:name/state
```

#### Добавить TCP устройство
```
POST /api/devices/add
Content-Type: application/json

{
  "name": "Device1",
  "type": "tcp",
  "address": "192.168.1.100",
  "port": "502",
  "timeout": 1000,
  "portsCount": 8
}
```

#### Добавить RTU устройство
```
POST /api/devices/add
Content-Type: application/json

{
  "name": "RTUDevice",
  "type": "rtu",
  "path": "/dev/ttyUSB0",
  "baudRate": 9600,
  "dataBits": 8,
  "stopBits": 1,
  "parity": "none",
  "unitId": 1,
  "timeout": 2000,
  "portsCount": 8
}
```

#### Обновить параметры устройства
```
PATCH /api/devices/:name
Content-Type: application/json

{
  "timeout": 2000,
  "port": "503"  // для TCP
  // или
  "baudRate": 19200  // для RTU
}
```

#### Удалить устройство
```
DELETE /api/devices/:name
```

### Каналы освещения

```
GET /api/lightChannels
POST /api/lightChannels/add
PATCH /api/lightChannels/:name
DELETE /api/lightChannels/:name
```

### Таймеры

```
GET /api/timers
POST /api/timers/add
PATCH /api/timers/:name
DELETE /api/timers/:name
```

## Архитектура

- **ModbusDevice** - управление Modbus TCP/RTU устройствами
- **DeviceManager** - менеджер устройств (singleton)
- **LightChannel** - канал освещения с управлением яркостью
- **ChannelsManager** - менеджер каналов освещения
- **Timer** - таймер с поддержкой рассвета/заката
- **TimerManager** - менеджер таймеров

## Технологии

- Node.js + Express
- jsmodbus - Modbus TCP/RTU протокол
- serialport - работа с последовательными портами
- node-localstorage - локальное хранилище
- Jest - тестирование
