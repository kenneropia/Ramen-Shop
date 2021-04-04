const express = require('express')
const authController = require('./../controllers/authController')
const likeController = require('./../controllers/likeController')

const router = express.Router({ mergeParams: true })

router.use(likeController.doesRamenExist, likeController.setRamenUserId)
router.use(authController.protect)
router
  .route('/')
  .post(likeController.createLike)
  .delete(likeController.deleteLike)

module.exports = router
