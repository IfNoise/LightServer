# Winston Logger с Loki

Все логи в проекте заменены на winston logger с поддержкой Grafana Loki.

## Что изменено

### Файлы с заменами:
- ✅ `src/app.js` - запуск сервера и graceful shutdown
- ✅ `src/models/Timer.js` - старт/стоп таймеров
- ✅ `src/models/TimerManager.js` - управление таймерами
- ✅ `src/models/LightChannel.js` - управление каналами
- ✅ `src/models/ChannelsManager.js` - менеджер каналов
- ✅ `src/models/ModbusDevice.js` - работа с Modbus устройствами
- ✅ `src/services/TimerService.js` - импорт логера

## Уровни логирования

### error
Критические ошибки, требующие внимания:
```javascript
logger.error("Failed to add timer", { error: e.message });
logger.error("Serial port error", { device: this.name, error: err.message });
```

### warn
Предупреждения о потенциальных проблемах:
```javascript
logger.warn("Channel has maxLevel=0, cannot calculate brightness", { channel: this.name });
```

### info
Информационные сообщения о важных событиях:
```javascript
logger.info("Server app listening at ${port} port", { port });
logger.info("Serial port opened", { device: this.name, path: this.options.path });
logger.info("Starting timer", { timer: this.name, interval: CONSTANTS.TIMER_INTERVAL });
```

### debug
Подробная отладочная информация:
```javascript
logger.debug("Timer state update", { timer: name, brightness, channelsCount: channels.length });
logger.debug("TCP updatePort", { device: this.name, port, value: newState });
logger.debug("MinLevel changed for channel", { channel: this.name, oldMinLevel, newMinLevel: this.minLevel });
```

## Структура логов

Все логи имеют структурированный формат с контекстом:

```javascript
// Плохо (старый способ)
console.log(`[Timer:${this.name}] Starting timer with interval ${CONSTANTS.TIMER_INTERVAL}ms`);

// Хорошо (новый способ)
logger.info("Starting timer", { timer: this.name, interval: CONSTANTS.TIMER_INTERVAL });
```

## Преимущества

1. **Структурированные логи** - легко парсить и анализировать
2. **Контекст** - каждый лог содержит метаданные (device, channel, timer и т.д.)
3. **Уровни логирования** - можно фильтровать по важности
4. **Grafana Loki** - агрегация и визуализация логов
5. **Файловые логи** - автоматическая ротация в production
6. **Цветной вывод** - удобное чтение в консоли

## Настройка Loki

1. Установите Grafana и Loki
2. Добавьте в `.env`:
```env
LOKI_HOST=http://localhost:3100
LOG_LEVEL=debug
```

3. Перезапустите сервер

## Примеры запросов в Loki

```logql
# Все логи приложения
{app="light-server"}

# Только ошибки
{app="light-server"} |= "error"

# Логи конкретного устройства
{app="light-server"} | json | device="TestDevice"

# Логи таймеров
{app="light-server"} | json | timer!=""
```
