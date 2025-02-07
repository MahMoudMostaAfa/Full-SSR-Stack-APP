/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const cors = require('cors');

const AppError = require('./utils/appError');
const GlobalErrorHandler = require('./controllers/errorController');

const toursRouter = require('./routes/toursRoutes');
const usersRouter = require('./routes/usersRoutes');
const reviewsRouter = require('./routes/reviewsRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLoabl middleware

// set security http headers
// for simple request such as get and post
app.use(
  cors({
    // allow all origins
    origin: '*',
    credentials: true,
  }),
);
// for preflight request such as put and delete
app.options('*', cors());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'"], // Default sources
      connectSrc: [
        "'self'",
        '*',
        // "'unsafe-inline'",
        // 'http://localhost:3000', // Allow connections to your backend
        // 'https://full-ssr-stack-app-5nyl.vercel.app/', // Add your production API URL
      ],
      scriptSrc: [
        "'self'",
        // "'unsafe-inline'",
        'https://unpkg.com',
        'https://cdnjs.cloudflare.com',
        'https://js.stripe.com',
        'https://vercel.live',
      ], // Allow scripts from unpkg.com
      styleSrc: [
        "'self'",
        // "'unsafe-inline'",
        'https://unpkg.com',
        'https://fonts.googleapis.com',
        'https://tile.openstreetmap.org',
        // Correct source for Google Fonts stylesheets
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'], // Allow font files from fonts.gstatic.com
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
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

app.use(compression());

// Routes for views
app.use('/', viewRouter);

// Routes for Apis
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);

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
