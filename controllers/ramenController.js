const multer = require('multer')
const sharp = require('sharp')

const Ramen = require('./../models/ramenModel')

const ApiError = require('../utils/apiError')

const catchAsync = require('./../utils/catchAsync')
const factory = require('./utils/handlerFactory')

exports.getAll = factory.getAll(Ramen)

exports.getOne = factory.getOne(Ramen, { path: 'isLike' })

exports.updateOne = factory.updateOne(Ramen)

exports.createOne = factory.createOne(Ramen)

exports.deleteOne = factory.deleteOne(Ramen)
