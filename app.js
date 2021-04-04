const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const ApiError = require('./utils/apiError')

const globalErrorHandler = require('./controllers/errorController')
const ramenRouter = require('./routers/ramenRouter')
const userRouter = require('./routers/userRouter')

const app = express()

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(cookieParser())
app.use(express.json({ limit: '10kb' }))

app.use('/api/v1/ramens', ramenRouter)
app.use('/api/v1/users', userRouter)

app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server`, 404))
})

app.use(globalErrorHandler)

module.exports = app
