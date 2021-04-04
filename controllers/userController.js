const multer = require('multer')
const sharp = require('sharp')
const ApiError = require('../utils/apiError')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const factory = require('./utils/handlerFactory')
const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users')
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1]
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   },
// })

const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new ApiError('Not an image! Please upload only images', 400), false)
  }
}
const upload = multer({ storage: multerStorage, fileFilter: multerFilter })

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next()
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 50 })
    .toFile(`public/img/users/${req.file.filename}`)
  next()
})

exports.getAllUsers = factory.getAll(User, null, 'password')

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id
  next()
}

exports.getUser = factory.getOne(User)

exports.updateMe = catchAsync(async (req, res) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new ApiError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    )
  }

  const filteredBody = filterObj(req.body, 'name', 'email')
  if (req.file) filteredBody.photo = req.file.filename
  // save work for password related things bc the 'this' will be present for the validators function so has for the password and psswordComfirm to be comfirm,
  // while for update associated commands it will be lost :).
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  })
  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })
  res.status(202).json({
    status: 'success',
  })
})

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  })
}

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  })
}

exports.deleteUser = factory.deleteOne(User)
