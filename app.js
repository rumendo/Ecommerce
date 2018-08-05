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

app.use(express.static('public'));

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


// route for Homepage
app.get('/', (req, res) => {
    getProducts().then(function (products) {
        //console.log(products);
        if (!(req.session.user && req.cookies.user_sid)) {
            products["command"] = '';
        }
        res.render('homepage', products);

    });
});

// route for Homepage
app.get('/parts', (req, res) => {
    getParts().then(function (parts) {
        console.log(parts);
        if (!(req.session.user && req.cookies.user_sid)) {
            parts["command"] = '';
        }
        res.render('parts', parts);
    });
});

app.get('/parts', (req, res) => {
    console.log(req.param('type'));
    getType(req.param('type')).then(function (products) {
        if (!(req.session.user && req.cookies.user_sid)) {
            products["command"] = '';
        }
        if(req.param('type') === "fork") {
            res.render('fork', products);
        }else if(req.param('type') === "wheels"){
            res.render('wheels', products);
        }else if(req.param('type') === "chain") {
            res.render('chain', products);
        }
    });
});

// app.get('/parts/wheels', (req, res) => {
//     getType(req.params.type).then(function (wheels) {
//         if (!(req.session.user && req.cookies.user_sid)) {
//             wheels["command"] = '';
//         }
//         console.log(wheels);
//         res.render('wheels', wheels);
//     });
// });
//
// app.get('/parts/chain', (req, res) => {
//     getType(req.params.type).then(function (chains) {
//         if (!(req.session.user && req.cookies.user_sid)) {
//             chains["command"] = '';
//         }
//         console.log(chains);
//         res.render('chains', chains);
//     });
// });

// route for contacts page
app.get('/contacts', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        var products = {"command":"Logged"};
    }
    res.render('contacts', products);
});

// route for product page
app.get('/product', function(req, res){
    getProduct(req.param('id')).then(function (product) {
        if (!(req.session.user && req.cookies.user_sid)) {
            product["command"] = '';
        }
        res.render('product', product);

    });
});

// route for adding product to cart
app.post('/addCart', function(req, res){
    getProduct(req.param('id')).then(function (product) {
        if (!(req.session.user && req.cookies.user_sid)) {
            product["command"] = '';
        }
        //if(addSucess) product["command"] = "Product added succesfuly.";
        res.render('product', product);
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
        console.log(req.param('id'));
        res.render('login', {id:req.param('id')});
    })
    .post((req, res) => {
        var email = req.body.email,
            password = req.body.password;

        User.findOne({ where: { email: email } }).then(function (user) {
            console.log(user);
            if (!user) {
                res.render('login', {
                        id : req.param('id'),
                        error: 'Incorrect email address or password!'
                });
            } else if (!user.validPassword(password)) {
                res.render('login', {
                        id: req.param('id'),
                        error: 'Incorrect email address or password!'
                });
            } else {
                req.session.user = user.dataValues;
                if(req.param('id')}){
                    res.redirect('addCart', req.param('id')});
                }
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

function getProducts(){
    return client.query("SELECT id, name, price, discount short_desc, img_path FROM product WHERE available_quantity > 0 AND discount > 15 AND NOT is_hidden;");
}

function getParts(){
    return client.query("SELECT * FROM category");
}

function getProduct(id){
    return client.query("SELECT * FROM product WHERE id = " + id + ";");
}

function getType(type){
    return client.query("SELECT * FROM product WHERE type = '" + type + "';");
}



// function getTypes() {
//     client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';").then(function (nameJSON) {
//         var types = [];
//         var names = [];
//         nameJSON = nameJSON.rows;
//         Object.keys(nameJSON).forEach(function(k){
//             names.push(nameJSON[k]["table_name"]);
//         });

//         names.forEach(function (name) {
//             if(!name.indexOf("product_")){
//                 types.push(name.substr(8));
//             }
//         });
//         console.log(types);
//     });
// }