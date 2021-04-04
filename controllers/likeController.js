const Like = require('./../models/likeModel')
const Ramen = require('./../models/ramenModel')

const factory = require('./utils/handlerFactory')
const catchAsync = require('../utils/catchAsync')
const ApiError = require('../utils/apiError')

exports.createLike = factory.createOne(Like)

exports.deleteLike = catchAsync(async (req, res) => {
  const like = await Like.findOneAndDelete({
    ramen: req.params.ramenId,
    user: req.user.id,
  })

  if (!like) {
    return next(new ApiError('No document found with that ID', 404))
  }

  res.status(204).json({
    status: 'success',
    data: null,
  })
})
exports.setRamenUserId = (req, res, next) => {
  if (req.params.ramenId) req.body.ramen = req.params.ramenId
  if (!req.body.user) req.body.user = req.user.id
  next()
}

exports.doesRamenExist = catchAsync(async (req, res, next) => {
  const ramen = await Ramen.findById(req.params.ramenId)

  if (!ramen) {
    return next(new ApiError('No document found with that ID', 404))
  }
  next()
})
