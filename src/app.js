// @flow

const express = require('express');
const middlewares = require('./middlewares');
const routes = require('./routes');

// Set up the express app
const app: express$Application = express();

app.use('/conf/', routes.conf);
app.use('/machine/', routes.machine);

app.use(middlewares.errors);

module.exports = app;