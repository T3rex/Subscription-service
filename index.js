const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51NbrjySGwZt6LGdsrLHyHUSyxVSaDOdSHP9K2bs8ZmohBjSRXyoHBSw1pKNpq6DlqdGkOSGeBKWaYFceOiVFAYm800YgMCdnGt');


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
  subId: {
   type: mongoose.Schema.Types.ObjectId,ref : 'Subscription'
  }
});

const subSchema = new mongoose.Schema({
  userId: {
   type: mongoose.Schema.Types.ObjectId,ref : 'User'
  },
  plan: {
    type: String,
    required: true
  },
  interval: {
    type: String,
    required: true
  }, 
});

const calculateAmount = (plan,interval)=>{

  const period = (interval=='Monthly') ? 1 : 10 ;
  let amount =0;
  if(plan== "Basic"){
    amount = period * 100;
    
  }
  else if( plan=='Standard'){
    amount = period * 200;
  }
  else if( plan=='Premium'){
    amount = period * 500;
  }
  else if(plan == 'Regular'){
    amount = period * 700;
  }
  return amount;
}


const User = mongoose.model('User', userSchema);
const Subscription = mongoose.model('Subscription', subSchema);

const userAuthenticate = async (req,res,next)=>{
  try{    
    const user = await User.findOne({email:req.headers.email, password:req.headers.password})   
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
    const sub = new Subscription({userId: req.user._id,plan:req.body.plan,interval:req.body.interval})
    await sub.save();
    req.user.subId = sub._id;
    const user = await User.findByIdAndUpdate(req.user._id,req.user);
    res.status(200).json({success:true,msg:"Subcription successful"});
  }catch(err){
     res.status(500).json({success: false, err: err});
  }
})

app.get('/secret',userAuthenticate ,async (req, res) => {
  const sub = await Subscription.findById(req.user.subId);  
  const amount = calculateAmount(sub.plan,sub.interval);  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'inr',
    automatic_payment_methods: {
      enabled: true,
    },
  })
  
  res.json({client_secret: paymentIntent.client_secret});
});


app.listen(port, () => {
  console.log(`Express app listening on port ${port}`)
})