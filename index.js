const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

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

  console.log(username)
  res.redirect('/')
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
