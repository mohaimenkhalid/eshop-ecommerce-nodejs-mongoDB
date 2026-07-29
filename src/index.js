const express = require('express');
const apiRoutes = require('./routes')
const errorHandler = require('./middlewares/error.middleware')
//application initialization
const app = express();

//application configuration bindings
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Layer Route entry hook
app.use('/', apiRoutes)


//middleware binding
app.use(errorHandler)

module.exports = app;