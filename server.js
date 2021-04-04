const mongoose = require('mongoose')

process.on('uncaughtException', (err) => {
  console.log('UNHANDLER EXCEPTION! Shutting down...')
  console.error(err.name, ':', err.message, err.stack)

  process.exit(1)
})



require('dotenv').config()

const DB =
  process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URL
    : process.env.MONGODB_LOCAL

const app = require('./app')

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    console.log('DB connection successful')
  })

const port = process.env.PORT || 7000

const server = app.listen(port, () => {
  console.log(`server at on ${port}`)
})

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION! Shutting down...')
  console.error(err.name, ':', err.message, err.stack)

  server.close(() => {
    process.exit(1)
  })
})
