const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const ApiError = require('./../utils/apiError')
const Email = require('./../utils/email')
const catchAsync = require('./../utils/catchAsync')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id)

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  })

  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  })
}

exports.signUP = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  })
  const url = `${req.protocol}://${req.get('host')}/me`

  createSendToken(newUser, 201, req, res)
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new ApiError('Please provide correct email and password'))
  }

  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new ApiError('Incorrect email or password', 401))
  }

  createSendToken(user, 200, req, res)
})

exports.logout = async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  })
  res.status(200).json({ status: 'success' })
}

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      )

      const currentUser = await User.findById(decoded.id)
      if (!currentUser) {
        return next()
      }
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next()
      }

      res.locals.user = currentUser
      return next()
    } catch (err) {
      return next()
    }
  }
  next()
}

exports.protect = catchAsync(async (req, res, next) => {
  let token = null
  if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  if (!token) {
    return next(
      new ApiError('You are not logged in! Please log in to get access', 401)
    )
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  const freshUser = await User.findById(decoded.id)
  if (!freshUser) {
    return next(
      new ApiError('The user belonging to this token does no longer exist', 401)
    )
  }

  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new ApiError('User recently changed password! Please log in again', 401)
    )
  }
  req.user = freshUser

  req.token = token
  res.locals.user = freshUser
  console.log(freshUser)
  next()
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You do not have permission to perform this action', 403)
      )
    }
    next()
  }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(new ApiError('Please provide an email', 401))
  }
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ApiError('There is no user with email address', 404))
  }

  const resetToken = user.createResetToken()
  await user.save({ validateBeforeSave: false })

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // })

    await new Email(user, resetURL).sendPasswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email',
    })
  } catch (err) {
    user.passwordResetExpires = undefined
    user.passwordResetToken = undefined
    await user.save({ validateBeforeSave: false })

    return next(
      new ApiError(
        'There was an error sending the email, Try again later!',
        500
      )
    )
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })
  if (!user) {
    return next(new ApiError('Token is invalid or has expired', 400))
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  createSendToken(user, 201, req, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password')

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new ApiError('Your current password is wrong', 401))
  }
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()
  8
  createSendToken(user, 200, req, res)
})
