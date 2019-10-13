require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const favicon = require('serve-favicon');

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const configDB = require('./config/db.js');

// configuration ===============================================================
mongoose.connect(configDB.url, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(express.static(path.join(__dirname, 'public'))); // managing static files
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'))); // favicon serving
app.use(express.urlencoded({ extended: true })); // get information from html forms

app.set('view engine', 'pug'); // set up pug for templating

// required for passport
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log(`Server has been started on port ${port}`);
