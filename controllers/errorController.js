const ApiError = require('./../utils/apiError')

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`
  return new ApiError(message, 400)
}

const handleDuplicateFieldDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
  const message = `Duplicate field value: ${value}. Pease use another value`
  return new ApiError(message, 400)
}

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message)
  const message = `Ivalid input data. ${errors.join('. ')}`
  return new ApiError(message, 400)
}

const handleJWTError = () =>
  new ApiError('Invalid token, please log in again', 401)

const handleJWTExpiredError = () =>
  new ApiError('Your token has expired! please log in again', 401)

const sendErrorDev = (err, req, res) => {
  console.log(err)
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    })
  } else {
    console.log(err)
    res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong', msg: err.message })
  }
}

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })

      // Programming or other unknown error: don't leak error details
    }
    // 1) Log error
    console.error('ERROR 💥', err)

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    })
  }
  if (err.isOperational) {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong', msg: err.message })
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  })
}

module.exports = (err, req, res, next) => {
  err.status = err.status || 'error'
  err.statusCode = err.statusCode || 500
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = {
      ...err,
      code: err.code,
      name: err.name,
      message: err.message,
      isOpertional: err.isOperational,
    }

    if (err.name === 'CastError') error = handleCastErrorDB(err)
    if (err.code === 11000) error = handleDuplicateFieldDB(err)
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err)
    if (err.name === 'JsonWebTokenError') error = handleJWTError()
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError()

    sendErrorProd(error, req, res)
  }
}
