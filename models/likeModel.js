const mongoose = require('mongoose')

const likeSchema = new mongoose.Schema(
  {
    like: {
      type: Boolean,
      required: false,
    },
    ramen: {
      type: mongoose.Schema.ObjectId,
      ref: 'Ramen',
      required: [true, 'Like must belong to a ramen'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Like must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: ['throw'],
  }
)

likeSchema.post('save', async function (docs, next) {
  const Ramen = require('./ramenModel')

  const ramen = await Ramen.findById(docs.ramen)
  if (ramen) {
    let likeCount = ramen.likeCount
    //+ 1 || 1

    await Ramen.findByIdAndUpdate(docs.ramen, { likeCount: likeCount + 1 })
  }
  next()
})

likeSchema.pre('findByIdAndDelete', async function () {
  const Ramen = require('./ramenModel')
  const { likeCount } = await Ramen.findById(this.ramen)
  await Ramen.findByIdAndUpdate(this.ramen, { likeCount: likeCount - 1 })
})

likeSchema.index({ ramen: 1, user: 1 }, { unique: true })

const Like = mongoose.model('Like', likeSchema)

module.exports = Like
