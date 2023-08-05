const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 1234

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false}));


mongoose.connect('mongodb://127.0.0.1:27017/subscription-service');

console.log("Mongodb connected")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
});
const User = mongoose.model('User', userSchema);


app.post('/signup', (req, res) => {
  try{
    const name = req.body.name;
    const email = req.body.email;
    const pass = req.body.password;
    const user = new User({ name: name, email: email, password: pass});
    user.save();
    res.status(201).json({success: true, msg: "User created successfully"});
  }
  catch(err){
    res.status(500).json({success: false, err: err});
  }
});

app.listen(port, () => {
  console.log(`Express app listening on port ${port}`)
})