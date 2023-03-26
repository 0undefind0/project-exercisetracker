const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const shortid = require('shortid')
const favicon = require('serve-favicon')
const path = require('path')
require('dotenv').config() // load all env variable

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))


// * DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connection established')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB: ', error)
  });

const userSchema = new mongoose.Schema({
  _id: {
    type: String, 
    default: shortid.generate
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  exercises: [
    {
      description: String,
      duration: Number,
      date: Date,
    }
  ]
})

const userModel = mongoose.model('User', userSchema);



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


/** GET user's exercise log
 * 
 */
app.get('/api/users/:_id/logs?[from][&to][&limit]', (req, res) => {

})


/** Create new user
 * @input username
 */
app.post('/api/users', (req, res) => {
  const username = req.body.username.trim();

  // TODO: validate username
  // Username should start with a letter or number, followed by any combination of letters, numbers, underscores, or hyphens, and is between 4 and 16 characters long
  const usernamePattern = new RegExp('^[a-zA-Z0-9_\\-]{4,16}$')
  const isValidUsername = usernamePattern.test(username)

  if(isValidUsername) {
    // save the new username to database with UUID
    // ! WTF is this?!!? my brain holy cant comprehend this shhhht
    let foundUser = userModel.findOne({"username": username})
    foundUser.exec()
      .then( user => {
        if (user) {
          const existingUser = {
            _id: user.id,
            "username": user.username,
          }
          res.json(existingUser);

        } else {
          // if user not found, then create new user
          const newUser = new userModel({
            _id: shortid.generate(),
            "username": username,
          })

          newUser.save()
            .then(user => {
              const createdUser = {
                _id: user.id,
                "username": user.username,
              }
              res.json(createdUser);
            })
            .catch( error => {
              console.log(error);
              res.status(500);
            })
        }

      })
      .catch( error => {
        console.log(error);
        res.status(500);

      });
    
  } else {
    res.redirect('/')
  }
})


/** Create new exercise for the user
 * @route POST /api/users/:_id/exercises
 * TODO: 
 */
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id.trim();
  let description = req.body.description.trim();
  let duration = req.body.duration.trim();
  let date = req.body.date.trim();

  // Validate the date
  const dateObject = new Date(date);
  if (date === "") {
    // if date is empty, then set it to today
    date = new Date().toDateString();
  }
  else if (!isNaN(dateObject.getTime())) {
    // date is valid after parsing
    date = dateObject.toDateString();
  }
  else {
    // not a date
    res.redirect(409, '/') // 409 Conflict
  }

  const foundUser = userModel.findById(userId)
  foundUser.exec()
    .then( user => {
      if (user) {
        // if user found, then create new exercise
        const newExercise = {
          description: description,
          duration: duration,
          date: date,
        }

        user.exercises.push(newExercise)
        user.save()
          .then( user => {
            const createdExercise = {
              _id: user.id,
              username: user.username,
              description: newExercise.description,
              duration: newExercise.duration,
              date: newExercise.date,
            }
            res.json(createdExercise);
          })
          .catch( error => {
            console.log(error);
            res.status(500);
          })

      } else {
        res.redirect('/')
      }
    })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
