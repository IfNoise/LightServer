module.exports = {
  apps: [
    {
      name: "Light Control Service",
      script: "./app.js",
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
        LOG_LEVEL: "debug",
        EMULATOR_PORT: "5020",
      },
    },
    {
      name: "Modbus Emulator",
      script: "./emulator/modbus-emulator.js",
      // Только для dev — не запускать в production
      env_development: {
        NODE_ENV: "development",
        EMULATOR_PORT: "5020",
        EMULATOR_HOST: "0.0.0.0",
      },
    },
  ],
};
