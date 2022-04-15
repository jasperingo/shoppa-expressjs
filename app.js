
require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var i18n = require('i18n');
var cors = require('cors');
const createHttpError = require('http-errors');
const { StatusCodes } = require('http-status-codes');

var apiRouter = require('./routes/EndPoints');
const ResponseDTO = require('./utils/ResponseDTO');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

i18n.configure({
  locales: ['en'],
  directory: path.join(__dirname, '/locales'),
  defaultLocale: 'en',
  updateFiles: false,
  objectNotation: true,
  autoReload: true,
});


app.use(cors({
  preflightContinue: true
}));

app.use(i18n.init);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.options('*', cors());

app.use('/api', apiRouter);


app.use(function(req, res, next) {
  next(createHttpError.NotFound({ data: { path: req.originalUrl } }));
});

app.use(function(err, req, res, _next) {

  //if (process.env.NODE_ENV === 'production')
  console.error(err);

  let message = '';

  switch(err.status) {
    case 400:
      message = req.__(err.message.message || "_error._bad_request");
      break;
    
    case 401:
      message = req.__(err.message.message || "_error._unauthorized");
      break;

    case 403:
      message = req.__(err.message.message || "_error._forbidden");
      break;
    
    case 404:
      message = req.__(err.message.message || "_error._not_found");
      break;
    
    default:
      message = req.__("_error._server");
  }

  const response = ResponseDTO.error(message, err.message.data);
  
  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).send(response);
});

module.exports = app;
