var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {
    User.findOne({username: req.body.username})   
    //checking whether that user is already present in the system or not
    .then((user) => {
        if(user != null) {
            var err = new Error('User ' + req.body.username + ' already exists!');
            err.status = 403;
            next(err);
        }
        else {
            return User.create({
                username: req.body.username,
                password: req.body.password
            });
        }
    })
    .then((user) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({status: 'Registration Successful!', user: user});
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.post('/login', (req, res, next) => {

    if(!req.session.user) {
        var authHeader = req.headers.authorization;
    
        if (!authHeader) {
            var err = new Error('You are not authenticated!');
            res.setHeader('WWW-Authenticate', 'Basic');
            err.status = 401;
            return next(err);
        }

        var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
        // In [0] index 'Basic' is there and in [1] index username and password is there.
        //1) Splitting them using space as the delimiter.
        //2) Converting the username and password to base64
        //3) After that again converting them to String 
        //4) And then splitting them using ':' as delimiter(as it will be in the form username:password)

        var username = auth[0];
        var password = auth[1];

        User.findOne({username: username})
        .then((user) => {
            if (user === null) {                         //Username does not exist in database
                var err = new Error('User ' + username + ' does not exist!');
                err.status = 403;
                return next(err);
            }
            else if (user.password !== password) {        //Password is incorrect
                var err = new Error('Your password is incorrect!');
                err.status = 403;
                return next(err);
            }
            else if (user.username === username && user.password === password) {
                req.session.user = 'authenticated';
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('You are authenticated!');
            }
        })
        .catch((err) => next(err));
    }
    //User is already authenticated
    else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('You are already authenticated!');
    }
});

router.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy();          //removing information from the server (server-side operation)
        res.clearCookie('session-id'); //deleting the particular session cookie (client-side operation) 
        res.redirect('/');             //redirecting the user to the homepage
    }
    else {
        var err = new Error('You are not logged in!');
        err.status = 403;
        next(err);
    }
});

module.exports = router;
