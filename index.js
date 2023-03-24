const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const shortid = require('shortid')
require('dotenv').config() // load all env variable

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))


// * DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connection established')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB: ', error)
  });

const userSchema = new mongoose.Schema({
  _id: String,
  username: String,
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
  const username = req.body.username;

  // TODO: validate username
  // Username should start with a letter or number, followed by any combination of letters, numbers, underscores, or hyphens, and is between 4 and 16 characters long
  const usernamePattern = new RegExp('^[a-zA-Z0-9_\\-]{4,16}$')
  const isValidUsername = usernamePattern.test(username)

  if(isValidUsername) {
    // TODO: save the new username to database with UUID
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
 * 
 */
app.post('/api/users/:_id/exercises', (req, res) => {

})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
