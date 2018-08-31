const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const shortid = require('shortid');

const mongoose = require('mongoose')
// mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
mongoose.Promise = global.Promise //for deprication warning
mongoose.connect(process.env.MLAB_URI , { useMongoClient: true })
  .then(() =>  console.log('mLab connection succesful'))
  .catch((err) => console.error(err))

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

//include models
const User = require('./models/user')
const Exercise = require('./models/exercise')

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//create user
app.post("/api/exercise/new-user", function (req, res) {
  User.find({username: req.body.username}).exec()
  .then(users => {
    if(users.length >= 1){
      return res.send('username already taken')
    }else{
      const user = new User({
        _id: shortid.generate(),
        username: req.body.username
      })
      user.save()
      .then(result => {
            res.json({
              username: result.username,
              _id: result._id
           })
         }
       )
       .catch(err => {
           res.status(500).json({
             error: err
          }) 
       })
     }
  })
});

//get all users
app.get("/api/exercise/users", function (req, res) {
  User.find().exec()
  .then(docs => {
    const users = docs.map(doc => {
      return {
        username: doc.username,
        _id: doc._id
      }
    })
    res.json(users)
  })
  .catch(err => { res.json({error: err}) })
});


//post exercise
app.post("/api/exercise/add", function (req, res) {

  User.findById(req.body.userId)
    .then(user => {
        if(!user){
            return res.send('unknown _id')
        }
        const exercise = new Exercise({
            _id: new mongoose.Types.ObjectId(),
            userId: req.body.userId,
            description: req.body.description,
            duration: req.body.duration,
            date: req.body.date
        })
        return exercise.save().then(
            result => {
                console.log(result)
                res.json({
                    username: user.username,
                    description: result.description,
                    duration: result.duration,
                    _id: result.userId,
                    date: result.date
                })
            }
        )

    })
    .catch(err => {
        console.log(err)
        return res.status(500).send('unknown _id')
    })
});

//get excercise log /api/exercise/log?{userId}[&from][&to][&limit]
//pupulate(fieldName, refTable fieldNames)
app.get("/api/exercise/log", function (req, res) {
  var limitVal = parseInt(req.query.limit) || 0
  var fromVal = req.query.from || 0
  var toVal = req.query.to || 0
  var query = {}
  //making custom conditional query for date range
  if(toVal){
    query = {
      userId: req.query.userId,
      date: {$gte: new Date(fromVal), $lt: new Date(toVal)}
    }
  }else{
    query = {
      userId: req.query.userId,
      date: {$gte: new Date(fromVal)}
    }
  }
  User.findOne({_id: req.query.userId}).exec()
  .then(user => {
    if(user){
       Exercise.find(query).limit(limitVal).exec()
        .then(docs => {
          // console.log(docs)
          res.json({
            _id: user._id,
            username: user.username,
            count: docs.length,
            log: docs.map(doc => {
              return {
                description: doc.description,
                duration: doc.duration,
                date: new Date(doc.date).toDateString()
                // user: doc.userId
              }
            })
          })
        })
    }else{
      res.send('unknown userId')
    }
  
  })
  .catch(err => {console.log(err)
                 res.json({error: err})})
  // console.log(req.query)
});

//this is a another shortCut mongoose version ofr previous method. didnt use for tiredness
app.get("/api/exercise/log/personal-efficient-implimentation-noUse", function (req, res) {
  var limitVal = parseInt(req.query.limit) || 0
  var fromVal = parseInt(req.query.from) || 0
  var toVal = parseInt(req.query.to) || 0
  var query = {}
  if(toVal){
    query = {
      userId: req.query.userId,
      date: {$gte: new Date(fromVal), $lt: new Date(toVal)}
    }
  }else{
    query = {
      userId: req.query.userId,
      date: {$gte: new Date(fromVal)}
    }
  }
  Exercise.find(query).populate('userId').limit(limitVal).exec()
  .then(docs => {
    // console.log(docs)
    res.json({
      _id: docs[0].userId._id,
      username: docs[0].userId.username,
      count: docs.length,
      log: docs.map(doc => {
        return {
          description: doc.description,
          duration: doc.duration,
          date: new Date(doc.date).toDateString()
          // user: doc.userId
        }
      })
    })
  })
  .catch(err => {res.json({error: err})})
});



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
