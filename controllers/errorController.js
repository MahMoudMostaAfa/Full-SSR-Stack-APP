const AppError = require('../utils/appError');

const handleCastError = (err) => {
  const message = `can not find ${err.value} in ${err.path}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `duplicate field value: ${value}. please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = () =>
  new AppError('invalid token. please log in again', 401);
const handleJWTExpiredError = () =>
  new AppError('token has expired. please log in again', 401);

const sendErrorForDev = (res, req, err) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      error: err,
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

const sendErrorForProd = (res, req, err) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error('💥', err);
      res.status(500).json({
        status: 'error',
        message: 'something went wrong !',
      });
    }
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message,
      });
    } else {
      console.error('💥', err);
      res.status(500).render('error', {
        title: 'Something went wrong',
        msg: 'please try again later',
      });
    }
  }
};

/// Global error middlewares
module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorForDev(res, req, err);
  } else if (process.env.NODE_ENV === 'production') {
    // due to prototype problem
    // let error = { ...err, name: err.name };
    let error = Object.create(err);

    // console.log(error.message);
    // console.log(err);
    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorForProd(res, req, error);
  }
};
