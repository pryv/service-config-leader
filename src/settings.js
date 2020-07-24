// @flow

const nconf = require("nconf");
const store = new nconf.Provider();
const path = require("path");

// 1. `process.env`
// 2. `process.argv`
//
store.env().argv();

// 3. Values in `config.json`
//
const configFile = store.get("config") || "dev-config.json";
store.file({ file: configFile });

// 4. Any default values
//
store.defaults({
  http: {
    port: 7000,
    ip: "127.0.0.1",
  },
  logs: {
    prefix: "service-configuration",
    console: {
      active: true,
      level: "info",
      colorize: true,
    },
    file: {
      active: false,
    },
    dataFolder: "/app/data",
  },
  internals: {
    tokenSignSecret: "SECRET",
  },
});

store.set(
  "pathToData",
  path.resolve(__dirname, "../", store.get("dataFolder"))
);

module.exports = store;
