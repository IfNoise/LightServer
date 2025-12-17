# LightServer RESTful API Documentation

## Общая информация

Все API endpoints начинаются с `/api/`

### Коды ответов HTTP

- `200 OK` - Успешная операция
- `201 Created` - Ресурс успешно создан
- `400 Bad Request` - Неверные параметры запроса
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Внутренняя ошибка сервера

## Devices API

### GET /api/devices
Получить список всех устройств

**Ответ:**
```json
[
  {
    "name": "Device1",
    "type": "tcp",
    "options": {
      "host": "192.168.1.100",
      "port": "502",
      "timeout": 1000
    }
  }
]
```

### POST /api/devices
Создать новое устройство (RESTful endpoint)

**Тело запроса:**
```json
{
  "name": "Device1",
  "type": "tcp",
  "address": "192.168.1.100",
  "port": "502",
  "timeout": 1000,
  "portsCount": 8
}
```

**Ответ (201):**
```json
{
  "status": "ok",
  "device": {
    "name": "Device1",
    "type": "tcp"
  }
}
```

### POST /api/devices/add
Создать новое устройство (Legacy endpoint для совместимости)

> **Примечание:** Используйте `POST /api/devices` вместо этого endpoint

### GET /api/devices/:name
Получить информацию об устройстве

**Ответ (200):**
```json
{
  "name": "Device1",
  "type": "tcp",
  "options": {
    "host": "192.168.1.100",
    "port": "502"
  }
}
```

**Ответ (404):**
```json
{
  "status": "error",
  "message": "Device not found"
}
```

### PATCH /api/devices/:name
Частичное обновление устройства

**Тело запроса:**
```json
{
  "timeout": 2000,
  "port": "503"
}
```

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### PUT /api/devices/:name
Полное обновление устройства

**Тело запроса:**
```json
{
  "type": "tcp",
  "address": "192.168.1.101",
  "port": "502",
  "timeout": 1000,
  "portsCount": 8
}
```

**Ответ (200):**
```json
{
  "status": "ok",
  "device": {
    "name": "Device1",
    "type": "tcp"
  }
}
```

### DELETE /api/devices/:name
Удалить устройство

**Ответ (200):**
```json
{
  "status": "ok"
}
```

**Ответ (404):**
```json
{
  "status": "error",
  "message": "Device not found"
}
```

### GET /api/devices/:name/state
Получить состояние устройства

**Ответ (200):**
```json
{
  "state": [true, false, true, false, false, false, false, false]
}
```

## Light Channels API

### GET /api/lightChannels
Получить список всех каналов

**Ответ:**
```json
[
  {
    "name": "Channel1",
    "device": "Device1",
    "port": 0,
    "maxLevel": 32767
  }
]
```

### POST /api/lightChannels
Создать новый канал (RESTful endpoint)

**Тело запроса:**
```json
{
  "name": "Channel1",
  "device": "Device1",
  "port": 0
}
```

**Ответ (201):**
```json
{
  "status": "ok"
}
```

### POST /api/lightChannels/add
Создать новый канал (Legacy endpoint для совместимости)

> **Примечание:** Используйте `POST /api/lightChannels` вместо этого endpoint

### GET /api/lightChannels/state
Получить состояние всех каналов

**Ответ (200):**
```json
{
  "Channel1": 100,
  "Channel2": 50
}
```

### GET /api/lightChannels/:name
Получить информацию о канале

**Ответ (200):**
```json
{
  "name": "Channel1",
  "device": "Device1",
  "port": 0,
  "maxLevel": 32767
}
```

**Ответ (404):**
```json
{
  "status": "error",
  "message": "Channel not found"
}
```

### PATCH /api/lightChannels/:name
Частичное обновление канала

**Тело запроса:**
```json
{
  "maxLevel": 30000,
  "port": 1
}
```

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### PUT /api/lightChannels/:name
Полное обновление канала

**Тело запроса:**
```json
{
  "device": "Device2",
  "port": 1,
  "maxLevel": 32767
}
```

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### DELETE /api/lightChannels/:name
Удалить канал

**Ответ (200):**
```json
{
  "status": "ok"
}
```

**Ответ (404):**
```json
{
  "status": "error",
  "message": "Channel not found"
}
```

### POST /api/lightChannels/remove
Удалить канал (Legacy endpoint для совместимости)

> **Примечание:** Используйте `DELETE /api/lightChannels/:name` вместо этого endpoint

### GET /api/lightChannels/:name/state
Получить состояние канала

**Ответ (200):**
```json
{
  "state": 100
}
```

### POST /api/lightChannels/:name/setMaxLevel
Установить максимальный уровень канала (Legacy endpoint)

> **Примечание:** Используйте `PATCH /api/lightChannels/:name` вместо этого endpoint

### POST /api/lightChannels/:name/setPort
Установить порт канала (Legacy endpoint)

> **Примечание:** Используйте `PATCH /api/lightChannels/:name` вместо этого endpoint

### POST /api/lightChannels/:name/setDevice
Установить устройство канала (Legacy endpoint)

> **Примечание:** Используйте `PATCH /api/lightChannels/:name` или `PUT /api/lightChannels/:name` вместо этого endpoint

## Timers API

### GET /api/timers
Получить список всех таймеров

**Ответ:**
```json
[
  {
    "name": "Timer1",
    "steps": 10,
    "stepTime": 60000,
    "sunriseTime": 360,
    "sunsetTime": 1200,
    "state": "stopped"
  }
]
```

### POST /api/timers
Создать новый таймер (RESTful endpoint)

**Тело запроса:**
```json
{
  "name": "Timer1",
  "steps": 10,
  "stepTime": 60000,
  "sunriseTime": 360,
  "sunsetTime": 1200
}
```

**Ответ (201):**
```json
{
  "status": "ok"
}
```

### POST /api/timers/add
Создать новый таймер (Legacy endpoint для совместимости)

> **Примечание:** Используйте `POST /api/timers` вместо этого endpoint

### GET /api/timers/:name
Получить информацию о таймере

**Ответ (200):**
```json
{
  "name": "Timer1",
  "steps": 10,
  "stepTime": 60000,
  "sunriseTime": 360,
  "sunsetTime": 1200,
  "state": "stopped",
  "channels": ["Channel1", "Channel2"]
}
```

**Ответ (404):**
```json
{
  "status": "error",
  "message": "Timer not found"
}
```

### PATCH /api/timers/:name
Частичное обновление таймера

**Тело запроса:**
```json
{
  "steps": 20,
  "stepTime": 30000
}
```

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### PUT /api/timers/:name
Полное обновление таймера

**Тело запроса:**
```json
{
  "steps": 15,
  "stepTime": 45000,
  "sunriseTime": 420,
  "sunsetTime": 1260
}
```

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### DELETE /api/timers/:name
Удалить таймер

**Ответ (200):**
```json
{
  "status": "ok"
}
```

**Ответ (404):**
```json
{
  "status": "error",
  "message": "Timer not found"
}
```

### POST /api/timers/remove
Удалить таймер (Legacy endpoint для совместимости)

> **Примечание:** Используйте `DELETE /api/timers/:name` вместо этого endpoint

### POST /api/timers/:name/setSteps
Установить количество шагов (Legacy endpoint)

> **Примечание:** Используйте `PATCH /api/timers/:name` вместо этого endpoint

### POST /api/timers/:name/setStepTime
Установить время шага (Legacy endpoint)

> **Примечание:** Используйте `PATCH /api/timers/:name` вместо этого endpoint

### POST /api/timers/:name/setSunriseTime
Установить время рассвета (Legacy endpoint)

> **Примечание:** Используйте `PATCH /api/timers/:name` вместо этого endpoint

### POST /api/timers/:name/setSunsetTime
Установить время заката (Legacy endpoint)

> **Примечание:** Используйте `PATCH /api/timers/:name` вместо этого endpoint

### POST /api/timers/:name/subscribe
Подписать каналы на таймер

**Тело запроса:**
```json
{
  "channels": ["Channel1", "Channel2"]
}
```

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### POST /api/timers/:name/unsubscribe
Отписать каналы от таймера

**Тело запроса:**
```json
{
  "channels": ["Channel1"]
}
```

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### POST /api/timers/:name/start
Запустить таймер

**Ответ (200):**
```json
{
  "status": "ok"
}
```

### POST /api/timers/:name/stop
Остановить таймер

**Ответ (200):**
```json
{
  "status": "ok"
}
```

## Примеры использования

### Создание устройства и канала

```bash
# Создать TCP устройство
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ModbusDevice1",
    "type": "tcp",
    "address": "192.168.1.100",
    "port": "502"
  }'

# Создать канал для устройства
curl -X POST http://localhost:3000/api/lightChannels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LightChannel1",
    "device": "ModbusDevice1",
    "port": 0
  }'
```

### Обновление параметров

```bash
# Частичное обновление канала
curl -X PATCH http://localhost:3000/api/lightChannels/LightChannel1 \
  -H "Content-Type: application/json" \
  -d '{
    "maxLevel": 30000
  }'

# Полное обновление устройства
curl -X PUT http://localhost:3000/api/devices/ModbusDevice1 \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tcp",
    "address": "192.168.1.101",
    "port": "502",
    "timeout": 2000
  }'
```

### Удаление ресурсов

```bash
# Удалить канал
curl -X DELETE http://localhost:3000/api/lightChannels/LightChannel1

# Удалить устройство
curl -X DELETE http://localhost:3000/api/devices/ModbusDevice1
```

## Миграция с Legacy API

Старые endpoints остаются доступными для обратной совместимости:

| Legacy Endpoint | RESTful Endpoint |
|----------------|------------------|
| `POST /api/devices/add` | `POST /api/devices` |
| `POST /api/lightChannels/add` | `POST /api/lightChannels` |
| `POST /api/lightChannels/remove` | `DELETE /api/lightChannels/:name` |
| `POST /api/lightChannels/:name/setMaxLevel` | `PATCH /api/lightChannels/:name` |
| `POST /api/lightChannels/:name/setPort` | `PATCH /api/lightChannels/:name` |
| `POST /api/timers/add` | `POST /api/timers` |
| `POST /api/timers/remove` | `DELETE /api/timers/:name` |
| `POST /api/timers/:name/setSteps` | `PATCH /api/timers/:name` |
| `POST /api/timers/:name/setStepTime` | `PATCH /api/timers/:name` |
| `POST /api/timers/:name/setSunriseTime` | `PATCH /api/timers/:name` |
| `POST /api/timers/:name/setSunsetTime` | `PATCH /api/timers/:name` |

Рекомендуется постепенно мигрировать на новые RESTful endpoints для лучшей совместимости и семантики HTTP.
