var createError = require('http-errors');
var path = require('path');
var logger = require('morgan');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mustacheExpress = require('mustache-express');

var User = require('./models/user');
var app = express();

//Psql connection
var pg = require('pg');
var conString = "postgres://ecommerce:root@localhost:5432/ecommerce";
var client = new pg.Client(conString);
client.connect();

app.use(express.static('public'))

// view engine setup
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/pages');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());



app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/homepage');
    } else {
        next();
    }
};

function getProducts(){
    return client.query("SELECT id, name, price, discount short_desc, img_path FROM product WHERE available_quantity > 0 AND discount > 15 AND NOT is_hidden");
}
function getProduct(id){
    return client.query("SELECT * FROM product WHERE id = " + id);
}

// route for Homepage
app.get('/', (req, res) => {
    getProducts().then(function (products) {
        console.log(products);
        if (req.session.user && req.cookies.user_sid) {
            res.render('homepage', products);
        } else {
            res.render('mainpage', products);
        }
    });
});

// route for product page
app.get('/product/:id', function(req, res){
    getProduct(req.params.id).then(function (product) {
        res.render('product', product.rows[0]);
    });
});


// route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.render('signup');
    })
    .post((req, res) => {
        User.create({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address
        })
            .then(user => {
                console.log(user.dataValues);
                req.session.user = user.dataValues;
                res.redirect('/');
            })
            .catch(error => {
                res.redirect('/error');
            });
    });


// route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        var email = req.body.email,
            password = req.body.password;

        User.findOne({ where: { email: email } }).then(function (user) {
            console.log(user);
            if (!user) {
                res.render('login', {
                        error: 'Incorrect email address or password!'
                });
            } else if (!user.validPassword(password)) {
                res.render('login', {
                        error: 'Incorrect email address or password!'
                });
            } else {
                req.session.user = user.dataValues;
                res.redirect('/');
            }
        });
    });


// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});


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
