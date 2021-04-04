const express = require('express')
const authController = require('./../controllers/authController')
const ramenController = require('./../controllers/ramenController')
const likeRouter = require('./likeRouter')

const router = express.Router()

router.use(authController.protect)

router.use('/:ramenId/like', likeRouter)

router
  .route('/')
  .get(ramenController.getAll)
  .post(authController.protect, ramenController.createOne)

router
  .route('/:id')
  .get(ramenController.getOne)
  .patch(authController.protect, ramenController.updateOne)
  .delete(authController.protect, ramenController.deleteOne)

module.exports = router
