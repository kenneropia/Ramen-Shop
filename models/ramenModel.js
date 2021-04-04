const mongoose = require('mongoose')
const Like = require('./likeModel')
const slugify = require('slugify')

const ramenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [30, 'A tour must have less or equal than 30 characters'],
      minlength: [10, 'A tour must have more or equal than 10 characters'],
      // validate: [isAlpha, 'Tour name must contain only character'],
    },
    slug: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, 'Description must have less or equal than 48 characters'],
      minlength: [10, 'Description must have more or equal than 10 characters'],
    },
    likeCount: {
      type: Number,
      required: false,
      default: 0,
    },
    image: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    special: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: 'throw',
  }
)

ramenSchema.virtual('isLike', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'ramen',
})

// ramenSchema.pre(/^find/, function (next) {
//   this.populate({ path: 'isLike' })
//   next()
// })

ramenSchema.pre('save', async function (next) {
  this.slug = slugify(this.name, { lower: true })

  this.likeCount = 0
  next()
})

const Ramen = mongoose.model('Ramen', ramenSchema)

module.exports = Ramen
