const mongoose = require('mongoose')
const shortid = require('shortid')

const userScheme = mongoose.Schema({
    _id: {
      'type': String,
      'default': shortid.generate
    },
    username: { 
        type: String, 
        unique: true, 
        required: true, 
    },
    
})

module.exports = mongoose.model('User', userScheme)