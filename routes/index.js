var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');
const flash = require('connect-flash');

passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
});

// Profile page
router.get("/profile",isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user}).populate("posts");
  // console.log(user);
  res.render("profile",{user})
})

// add post 
router.get("/addpost",isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("addpost",{user})
})

router.get("/feed",isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find().populate("user")
  res.render("feed",{user,posts})
})

router.post("/createpost",isLoggedIn,upload.single("postimage"), async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title:req.body.title,
    description:req.body.description,
    image: req.file.filename
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile")
})

// profile image 
router.post("/fileupload",isLoggedIn,upload.single("image"), async function(req,res,next){
 const user = await userModel.findOne({username: req.session.passport.user});
 user.profileImage = req.file.filename;
 await user.save();
 res.redirect("/profile")
})

// Register page
router.get('/register', function(req, res, next) {
  res.render('register');
});

router.post('/register', function(req, res, next) {
  const data = new userModel({
    name:req.body.name,
    username:req.body.username,
    email : req.body.email,

  })
  userModel.register(data , req.body.password).then(function(){
    passport.authenticate("local")(req,res, function(){
      res.redirect("/profile")
    })
  })
});

// login page
router.get('/login', function(req, res, next) {
  console.log("done")
  res.render('index');
});

router.post('/login', passport.authenticate("local",{
  failureRedirect:"/login",
  failureMessage:true
}), function(req,res,next){
  res.redirect("/profile",)
});

router.get("/logout",function(req,res,next){
  req.logout(function(err){
    if(err){ return next(err);}
    res.render('home')
  });
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.render('home');
}

module.exports = router;
