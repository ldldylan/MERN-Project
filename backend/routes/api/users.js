var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const passport = require('passport');
const User = mongoose.model('User');
const { loginUser, restoreUser } = require('../../config/passport');
const { isProduction } = require('../../config/keys');
const validateRegisterInput = require('../../validations/register');
const validateLoginInput = require('../../validations/login');
const { singleFileUpload, singleMulterUpload } = require("../../awsS3");
const DEFAULT_PROFILE_IMAGE_URL ="https://aws-mern-pixelpanda.s3.us-west-1.amazonaws.com/defaultprofile.jpg"
/* GET users listing. */
router.get('/', function(req, res, next) {
  // res.send('respond with a user 13131232resource');
  res.json({
    message: "GET /api/users"
  });
});

// POST /api/users/register
router.post('/register', singleMulterUpload("image"), validateRegisterInput,async (req, res, next) => {
  // Check to make sure no one has already registered with the proposed email or
  // username.
  
  const user = await User.findOne({
    $or: [{ email: req.body.email }]//, { username: req.body.username }]
  });

  if (user) {
    // Throw a 400 error if the email address and/or username already exists
    const err = new Error("Validation Error");
    err.statusCode = 400;
    const errors = {};
    if (user.email === req.body.email) {
      errors.email = "A user has already registered with this email";
    }
    if (user.username === req.body.username) {
      errors.username = "A user has already registered with this username";
    }
    err.errors = errors;
    return next(err);
  }
  // Otherwise create a new user
  const profileImageUrl = req.file ?
    await singleFileUpload({ file: req.file, public: true }) :
    DEFAULT_PROFILE_IMAGE_URL;
  const newUser = new User({
    username: req.body.username,
    profileImageUrl,
    email: req.body.email
  });

  bcrypt.genSalt(10, (err, salt) => {
    if (err) throw err;
    bcrypt.hash(req.body.password, salt, async (err, hashedPassword) => {
      if (err) throw err;
      try {
        newUser.hashedPassword = hashedPassword;
        const user = await newUser.save();
        return res.json(await loginUser(user)); // <-- THIS IS THE CHANGED LINE
      }
      catch(err) {
        next(err);
      }
    })
  });
});

// POST /api/users/login
router.post('/login', validateLoginInput,async (req, res, next) => {
  passport.authenticate('local', async function(err, user) {
    if (err) return next(err);
    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 400;
      err.errors = { email: "Invalid credentials" };
      return next(err);
    }
    return res.json(await loginUser(user)); // <-- THIS IS THE CHANGED LINE
  })(req, res, next);
});

router.get('/current', restoreUser, (req, res) => {
  if (!isProduction) {
    // In development, allow React server to gain access to the CSRF token
    // whenever the current user information is first loaded into the
    // React application
    const csrfToken = req.csrfToken();
    res.cookie("CSRF-TOKEN", csrfToken);
  }
  if (!req.user) return res.json(null);
  res.json({
    _id: req.user._id,
    // username: req.user.username,
    // profileImageUrl: req.user.profileImageUrl, 

    email: req.user.email
  });
});

module.exports = router;