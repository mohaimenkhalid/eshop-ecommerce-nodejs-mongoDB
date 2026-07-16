const express = require('express');
const apiRoutes = require('./routes')
const errorHandler = require('./middlewares/error.middleware')
//application initialization
const app = express();

//application configuration bindings
app.use(express.json());

// API Layer Route entry hook
app.use('/', apiRoutes)


//middleware binding
app.use(errorHandler)

module.exports = app;