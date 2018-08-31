const mongoose = require('mongoose')
const shortid = require('shortid')

const exerciseScheme = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: { type: String, ref: 'User', required: true}, //ref is for relation. not useful for mongodb
  description: { type: String, required: true},
  duration: { type: Number, min: 1, required: true},
  date: { type : Date, default: Date.now, required: true}
})

module.exports = mongoose.model('Exercise', exerciseScheme)