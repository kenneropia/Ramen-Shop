const express = require('express')
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')
const multer = require('multer')

const router = express.Router()

router.post('/signup', multer().none(), authController.signUP)
router.post('/login', multer().none(), authController.login)
router.get('/logout', authController.logout)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

router.use(authController.protect)

router.patch('/updateMyPassword', authController.updatePassword)
router.get('/me', userController.getMe, userController.getUser)
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
)
router.delete('/deleteMe', userController.deleteMe)

// router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser)

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)

module.exports = router
