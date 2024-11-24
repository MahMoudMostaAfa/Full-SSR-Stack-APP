/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const AppError = require('./utils/appError');
const GlobalErrorHandler = require('./controllers/errorController');

const toursRouter = require('./routes/toursRoutes');
const usersRouter = require('./routes/usersRoutes');
const reviewsRouter = require('./routes/reviewsRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLoabl middleware

// set security http headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Default sources
      scriptSrc: [
        "'self'",
        'https://unpkg.com',
        'https://cdnjs.cloudflare.com',
      ], // Allow scripts from unpkg.com
      styleSrc: [
        "'self'",
        'https://unpkg.com',
        'https://fonts.googleapis.com',
        'https://tile.openstreetmap.org',
        // Correct source for Google Fonts stylesheets
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'], // Allow font files from fonts.gstatic.com
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
    },
  }),
);
// morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// limit request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many request from this ip, please try again in an hour',
});

app.use('/api', limiter);
// this is middleware allow us to see body of request
app.use(
  express.json({
    limit: '10kb',
  }),
);
app.use(cookieParser());

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

//  data sanitization against xss attacks
app.use(xss());
// use match in schema to prevent anythings except characters and spacesS

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

/// serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));
// app.use((req, res, next) => {
//   console.log('helllo from the middleware 😉');

//   next();
// });
// app.use((req, res, next) => {
//   console.log('hello from the middleware  2😉');
//   req.requestTime = new Date().toISOString();
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// Routes for views
app.use('/', viewRouter);

// Routes for Apis
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);

// unhandled routes
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can not find ${req.originalUrl}`,
  // });

  // const err = new Error(`can not find ${req.originalUrl}`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`can not find ${req.originalUrl}`, 404));
});

// Global error middleware
app.use(GlobalErrorHandler);

module.exports = app;
