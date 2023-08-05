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
  plan: String,
  interval: String
});
const User = mongoose.model('User', userSchema);

const userAuthenticate = async (req,res,next)=>{
  try{    
    const user = await User.findOne({email:req.body.email, password:req.body.password})   
    if(user){
      req.user = user;
      next();
    }
    else{
      res.status(500).json({msg: 'Login failed'});
    }
  }catch(err){

  }
}

app.post('/signup', (req, res) => {
  try{
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const user = new User({ name: name, email: email, password: password});
    user.save();
    res.status(201).json({success: true, msg: "User created successfully"});
  }
  catch(err){
    res.status(500).json({success: false, err: err});
  }
});

app.post('/login',userAuthenticate,(req,res)=>{
  try{
    res.status(200).json({success:true,msg:"User authenticated"});
  }catch(err){
     res.status(500).json({success: false, err: err});
  }
})

app.post('/subscribe',userAuthenticate,async(req,res)=>{
  try{   
    req.user.plan = req.body.plan;;
    req.user.interval = req.body.interval;    
    const user = await User.findByIdAndUpdate(req.user._id,req.user);
    res.status(200).json({success:true,msg:"Subcription successful"});
  }catch(err){

     res.status(500).json({success: false, err: err});
  }
})


app.listen(port, () => {
  console.log(`Express app listening on port ${port}`)
})