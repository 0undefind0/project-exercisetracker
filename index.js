const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const shortid = require('shortid')
const favicon = require('serve-favicon')
const path = require('path')
const moment = require('moment-timezone')
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


/**
 * Get a list of all users
 * GET request to /api/users to get a list of all users.
 * @route GET /api/users
 * @returns array of user objects containing _id and username properties
 */
app.get('/api/users', (req, res) => {
  const allUsers = userModel.find({})
  allUsers.exec()
    .then( users => {
      const allUsers = users.map( user => {
        return {
          _id: user.id,
          username: user.username,
        }
      })
      res.json(allUsers);
    })
    .catch( error => {
      console.log(error);
      res.status(500);
    })
  
})


/** 
 * GET user's exercise log
 * GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
 * @route GET /api/users/:_id/logs?[from][&to][&limit]
 * @params *_id, ?from, ?to, ?limit
 * @returns a user object with a count property representing the number of exercises that belong to that user.
 * TODO: add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.
 */
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id.trim();
  let {from} = req.query;
  let {to} = req.query;
  let {limit} = req.query;

  if (from) {
    from = from.trim() ? new Date(from.trim()) : new Date(0); // defaults to 1970-01-01 beginning of time
  }
  else {
    from = new Date(0);
  }

  if (to) {
    to = to.trim() ? new Date(to.trim()) : new Date(); // defaults to current date
  }
  else {
    to = new Date();
  }

  if (limit) {
    limit = limit.trim() ? parseInt(limit.trim()) : Number.MAX_SAFE_INTEGER; // defaults to no limit
  }
  else {
    limit = Number.MAX_SAFE_INTEGER;
  }

  // Check if from and to are valid date and from is before to
  if (from == 'Invalid Date') {
    res.status(400).json('Invalid date format for from parameter');
  }
  else if (to == 'Invalid Date') {
    res.status(400).json('Invalid date format for to parameter');
  }
  else if (!(from <= to)) {
    console.log(`from: ${from}, to: ${to}`)
    res.status(400).json('Invalid date range');
  }

  console.log(from);
  console.log(new Date(from.toISOString()));

  userModel
    .find({
      _id: userId,
      exercises: {
        $elemMatch: {
          date: {
            $gte: new Date(from.toISOString()),
            $lte: new Date(to.toISOString()),
          }
        }
      }
    })
    .limit(limit)
    .select('_id username exercises')
    .exec()
    .then( user => {
      var userObject = user[0].toObject();
      userObject.exercises.filter( exercise => {
        console.log(`exercise.date: ${exercise.date}, from: ${from}`);
        return new Date(exercise.date.toISOString()) >= new Date(from.toISOString())
      })
      userObject.count = userObject.exercises.length;
      res.json(userObject);
    })
    .catch( err => {
      res.status(500).send(err);
    });


  // const user = userModel.findById(userId);
  // user.exec()
  //   .then( user => {
  //     if (user) {
  //       // if user found, then return the user object
  //       const userObject = {
  //         _id: user.id,
  //         username: user.username,
  //         count: user.exercises.length,
  //         log: user.exercises.filter( exercise => {
  //           console.log(`exercise.date: ${exercise.date.toUTCString()} (${exercise.date.toUTCString() >= from.toUTCString()}), from: ${from.toUTCString()}, to: ${to.toUTCString()} (${exercise.date.toUTCString() <= to.toUTCString()})`);
  //           return exercise.date.toUTCString() >= from.toUTCString() && exercise.date.toUTCString() <= to.toUTCString()
  //         })
  //           .map( exercise => {
  //             return {
  //               description: exercise.description,
  //               duration: exercise.duration,
  //               date: exercise.date.toDateString(),
  //             }
  //           })
  //           .slice(0, limit)
  //       }
  //       res.json(userObject);
  //     }
  //     else {
  //       // if user not found, then return 404
  //       res.status(404).json('User not found');
  //     }
  //   })
  //   .catch( error => {
  //     console.log(error);
  //     res.status(500);
  //   })

})


/** Create new user
 * POST to /api/users with form data username to create a new user.
 * @route POST /api/users
 * @reqcontent username
 * @returns user object with username and _id properties
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

        } 
        else {
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

  } 
  else {
    res.redirect('/')
  }
})


/** Create new exercise for the user
 * POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.
 * @route POST /api/users/:_id/exercises
 * @param _id user's id
 * @reqcontent _id, description, duration, [date]
 * @returns user object with username, _id, description, duration, and date properties
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

      } 
      else {
        res.redirect('/')
      }
    })
    .catch( error => {
      console.log(error);
      res.status(500);
    })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
