const mongoose = require('mongoose');
const Intl = require('intl');
const Task = require('./models/task.js');
const User = require('./models/user');

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();

  // if they aren't redirect them to the home page
  res.redirect('/login');
}

function getDate() {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('ru', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return formatter.format(d);
}

module.exports = function(app, passport) {
  app.get('/', isLoggedIn, async function(req, res) {
    const tasks = await Task.find({ doer: req.user.local._id }, function(
      err,
      docs
    ) {
      if (err) console.log(err);
      return docs;
    });
    const date = getDate();
    console.log(tasks);
    res.render('index.pug', { user: req.user, date, tasks });
  });

  // show the login form
  app.get('/login', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('login.pug', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post(
    '/login',
    passport.authenticate('local-login', {
      successRedirect: '/', // redirect to the secure main page
      failureRedirect: '/login', // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // show the signup form
  app.get('/signup', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('signup.pug', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post(
    '/signup',
    passport.authenticate('local-signup', {
      successRedirect: '/', // redirect to the secure main page
      failureRedirect: '/signup', // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // profile
  app.get('/profile', isLoggedIn, async function(req, res) {
    const users = await User.find({}, function(err, docs) {
      if (err) console.log(err);
      return docs;
    });
    res.render('profile.pug', { user: req.user, users });
  });

  // logout
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
};
