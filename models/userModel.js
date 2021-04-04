const crypto = require('crypto')
const mongoose = require('mongoose')
const { isEmail } = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minlength: [4, 'A name can"t be less than 4 letters'],
      maxlength: [32, 'A anem can"t be longer than 32 letter'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      trim: true,
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please provide a vaild email'],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'cook', 'lead-cook', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please comfirm your password'],
      validate: [
        // The `this` on works on create and save
        function (val) {
          return val === this.password
        },
        'Passwords are not the same',
      ],
    },
    passwordChangedAt: { type: Date },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: 'throw',
  }
)

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } })
  next()
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next()

  this.passwordChangedAt = Date.now() - 1000
  next()
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 5)

  this.passwordConfirm = undefined
  next()
})

userSchema.methods.correctPassword = async function (cP, uP) {
  return await bcrypt.compare(cP, uP)
}

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const chargedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    )

    return JWTTimeStamp < chargedTimeStamp
  }

  return false
}

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000

  return resetToken
}

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

const User = mongoose.model('User', userSchema)

module.exports = User
