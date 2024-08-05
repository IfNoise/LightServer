module.exports = {
  apps : [{
    name   : "Light Control Service",
    script : "./app.js",
     env_production: {
       NODE_ENV: "production"
    },
    env_development: {
       NODE_ENV: "development"
    }
  }]
}
