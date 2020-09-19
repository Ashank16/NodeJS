var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//adding our own files
var dishRouter = require('./routes/dishRouter');
var promoRouter = require('./routes/promoRouter');
var leaderRouter = require('./routes/leaderRouter');

//connecting to the mongoose server
const mongoose = require('mongoose');

const Dishes = require('./models/dishes');

//establishing connection with the server
const url = 'mongodb://localhost:27017/conFusion';
const connect = mongoose.connect(url);

connect.then((db) => {
    console.log("Connected correctly to server");
}, (err) => { console.log(err); });

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//applying authorization
function auth (req, res, next) {
    console.log(req.headers);
    var authHeader = req.headers.authorization;  //checking auth in the request header
    if (!authHeader) {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');  
        //challenging user to auth him/herself by responding in the response header
        err.status = 401;
        return next(err);        
    }

    var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    // In [0] index 'Basic' is there and in [1] index username and password is there.
    //1) Splitting them using space as the delimiter.
    //2) Converting the username and password to base64
    //3) After that again converting them to String 
    //4) And then splitting them using ':' as delimiter(as it will be in the form username:password)
    
    //Now checking it is correct or not
    var username = auth[0];
    var password = auth[1];
    if (username === 'admin' && password === 'password') {
        next();                                                 // authorized
    } 
    else {
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');      
        err.status = 401;
        next(err);
    }
}

app.use(auth);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

//mounting our own routes
app.use('/dishes',dishRouter);
app.use('/promotions',promoRouter);
app.use('/leaders',leaderRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
