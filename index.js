const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config() // load all env variable


// * DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connection established')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB: ', error)
  })



app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended:false}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req,res) => {
  const username = req.body.username;

  // TODO: validate username
  // Usernames should start with a letter or number, followed by any combination of letters, numbers, underscores, or hyphens, and is between 4 and 16 characters long.
  const usernamePattern = new RegExp('^[a-zA-Z0-9_\\-]{4,16}$')
  const isValidUsername = usernamePattern.test(username)

  if (isValidUsername) {
    
  }

  console.log(`"${username}" \t: isValidUsername:${isValidUsername}`)
  res.redirect('/')
})


const generateUserID = () => {
  const timestamp = Date.now().toString(36); // Convert current timestamp to base-36 string
  const randomString = Math.random().toString(36).substring(2,8)
}


const listener = app.listen(process.env.PORT || 3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
