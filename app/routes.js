const mongoose = require('mongoose');
const Intl = require('intl');
const Task = require('./models/task.js');
const User = require('./models/user');

// DONE - выдавать пользователю только невыполненные задачи;
// FIXME - собирать статистику выполненых/невыполненных/просроченных заданий для каждого пользователя

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();

  // if they aren't redirect them to the home page
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.user.local.admin) return next();
  res.redirect('/');
}

function getDate() {
  const d = new Date();
  // const formatter = new Intl.DateTimeFormat('ru', {
  //   weekday: 'long',
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric',
  // });
  // return formatter.format(d);
  const DAY = [
    'воскресенье',
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота',
  ];
  const MONTH = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return `${DAY[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

module.exports = function(app, passport) {
  app.get('/', isLoggedIn, async function(req, res) {
    const tasks = await Task.find(
      {
        doer: req.user._id,
        done: false,
      },
      function(err, docs) {
        if (err) console.log(err);
        return docs;
      }
    );
    const date = getDate();
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
    users.forEach(async item => {
      const tasks = await Task.find(
        {
          doer: item._id,
        },
        function(err, docs) {
          if (err) console.log(err);
          return docs;
        }
      );
      item.countOfTasks = tasks.length;
      item.countOfDoneTasks = 0;
      item.countOfExpiredTasks = 0;
      tasks.forEach(task => {
        if (task.done) item.countOfDoneTasks += 1;
        if (!task.done && task.date < Date.now()) item.countOfExpiredTasks += 1;
      });
    });
    const date = getDate();
    console.log(users);
    res.render('profile.pug', {
      user: req.user,
      users,
      date,
    });
  });

  app.post('/profile', isLoggedIn, isAdmin, function(req, res) {
    const { userId } = req.body;
    User.findByIdAndRemove(userId, function(err, doc) {
      if (err) return console.log(err);
      console.log('Удален пользователь ', doc);
    });
    res.redirect('/profile');
  });

  // logout
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/profile/:userId', isLoggedIn, isAdmin, async function(req, res) {
    const tasks = await Task.find(
      {
        doer: req.params.userId,
      },
      function(err, docs) {
        if (err) console.log(err);
        return docs;
      }
    );
    const currentUser = await User.find(
      {
        _id: req.params.userId,
      },
      function(err, docs) {
        if (err) console.log(err);
        return docs;
      }
    );
    const date = getDate();
    res.render('user.pug', {
      user: req.user,
      tasks,
      date,
      currentUser: currentUser[0],
    });
  });

  app.post('/profile/:userId', isLoggedIn, isAdmin, async function(req, res) {
    const task = new Task({
      objective: req.body.objective,
      description: req.body.description,
      doer: req.body.userId,
      date: req.body.date,
    });

    task.save(function(err) {
      if (err) return console.log(err);
      console.log('Задача успешно добавлена. Задача: ', task);
    });
    res.redirect(`/profile/${req.params.userId}`);
  });

  app.post('/done', isLoggedIn, async function(req, res) {
    const backURL = req.header('Referer') || '/';
    const { taskId } = req.body;
    const task = await Task.findById(taskId, function(err, doc) {
      if (err) console.log(err);
      return doc;
    });
    task.done = !task.done;
    task.save(function(err) {
      if (err) return console.log(err);
      console.log('Отмечено успешно');
    });
    res.redirect(backURL);
  });

  app.post('/del', isLoggedIn, isAdmin, function(req, res) {
    const backURL = req.header('Referer') || '/';
    const { taskId } = req.body;
    Task.findByIdAndRemove(taskId, function(err, doc) {
      if (err) return console.log(err);
      console.log('Удалена задача ', doc);
    });
    res.redirect(backURL);
  });
};
