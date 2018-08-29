var createError = require('http-errors');
var path = require('path');
var logger = require('morgan');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mustacheExpress = require('mustache-express');
var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt');

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
        products.rows.forEach(function (product, index, rows) {
            rows[index]["discount"] = product["price"] * (100-product["discount"]) / 100;
        });
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

// route returning a list of manufacturers
app.get('/parts/search', function(req, res){
    getManufacturers(req.param('type')).then(function (manufacturers) {
        var minPrice = req.param('minPrice');
        var maxPrice = req.param('maxPrice');
        if(req.param('manufacturer'))
            manufacturers = req.param('manufacturer');
        if(!minPrice)
            minPrice = '0';
        if(!maxPrice)
            maxPrice = '2147483647';
        manufacturers = JSON.stringify(manufacturers);
        manufacturers = '{' + manufacturers.slice(1);
        manufacturers = manufacturers.slice(0, -1) + '}';

        console.log(manufacturers);

        filterProducts(req.param('type'), manufacturers, minPrice, maxPrice).then(function (products) {
            console.log(products);
            res.render('fork', partsRender(products, req));
        });
    });
});

app.get('/parts/*', (req, res) => {
    getType(req.param('type')).then(function (products) {
        res.render('fork', partsRender(products, req));
    });
});


// route for contacts page
app.get('/contacts', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        var products = {"command":"Logged"};
    }
    res.render('contacts', products);
});

// route returning a list of manufacturers
app.get('/filter/manufacturers/*', function(req, res){
    getManufacturers(req.params[0]).then(function (manufacturers) {
        res.send(manufacturers);
    });
});

// // route returning a list of manufacturers
// app.get('/filter/prices/*', function(req, res){
//     getPrices(req.params[0]).then(function (prices) {
//         console.log(prices);
//         res.send(prices);
//     });
// });

// route for product page
app.get('/product', function(req, res){
    getProduct(req.param('id')).then(function (product) {
        if (!(req.session.user && req.cookies.user_sid)) {
            product["command"] = '';
        }
        product.rowCount = product.rows[0]["name"];
        res.render('product', product);
    });
});

// route for adding product to cart
app.post('/addCart', function(req, res){
    getProduct(req.param('id')).then(function (product) {
        if (!(req.session.user && req.cookies.user_sid)) {
            product["command"] = '';
        }
        console.log(req.session.user.id);
        addToCart(req.session.user.id, req.param('id'), req.param('quantity')).then(function (response) {
        //     if(response) product["command"] = "Product added succesfuly.";
        //     else product["command"] = "There was a problem. Please try again.";
        });
        res.render('product', product);
    });
});

// route for deleting product from cart

app.post('/rmCart', function(req, res){
    rmCart(req.session.user.id, req.param('pid')).then(function (product) {
        if (!(req.session.user && req.cookies.user_sid)) {
            product["command"] = '';
        }
        res.redirect('cart');
    });
});

// route for cart page
app.get('/cart', (req, res) => {
    getCart(req.session.user.id).then(function (products) {
        if (!(req.session.user && req.cookies.user_sid)) {
            products["command"] = '';
        }

        products.rows.forEach(function (product, index, rows) {
            rows[index]["price"] = product["price"] * product["sum"] * (100-product["discount"]) / 100;
            products.oid += rows[index]["price"];
        });
        console.log("LMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAOLMAO");
        console.log(products);
        res.render('cart', products);
    });
});

app.get('/quantityUpdate', function (req, res) {
    quantityUpdate(req.param('quantity'), req.session.user.id, req.param('pid')).then(function (price) {
        res.send(price);
    })
});

app.route('/checkout')
    .get((req, res) => {

        console.log("checkin out");
        userDataCheckout(req.session.user.id, req.param('pid')).then(function (user) {
            if (!(req.session.user && req.cookies.user_sid)) {
                user["command"] = '';
            }
            res.render('checkout', user);
        });
    })
    .post((req, res) => {

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
            address: req.body.address,
            phone: req.body.phone
        })
            .then(user => {
                console.log(user.dataValues);
                // req.session.user = user.dataValues; // Login User without email confirmation
                accountConfirmEmail(req.body.last_name, req.body.email);
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

        checkVerification(req.body.email).then(function (is_verified) {
            if(is_verified.rowCount) {
                User.findOne({where: {email: email}}).then(function (user) {
                    console.log(user);
                    if (!user) {
                        res.render('login', {
                            id: req.param('id'),
                            error: 'Incorrect email address or password!'
                        });
                    } else if (!user.validPassword(password)) {
                        res.render('login', {
                            id: req.param('id'),
                            error: 'Incorrect email address or password!'
                        });
                    } else {
                        req.session.user = user.dataValues;
                        if (req.param('id')) {
                            res.redirect('/product' + '?id=' + req.param('id'));
                        }
                        res.redirect('/');
                    }
                });
            } else
                res.redirect('/'); // Print a message saying email verification is needed.
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

// route for email confirmation
app.get('/emailConfirmation', (req, res) => {
    let hash = bcrypt.hashSync(req.param('uuid'), 10);
    checkUuid(hash).then(function (result) {
        console.log(result);
        if(result.rowCount) {
            verifyUser(result.rows[0]).then(function (is_verified) {
                if(is_verified.rowCount)
                    res.redirect('/');
                // else ..
            });
        }
        res.redirect('/error');
    });
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
    return client.query("SELECT id, name, price, discount, short_desc, img_path FROM product WHERE available_quantity > 0 AND discount > 15 AND NOT is_hidden ORDER BY discount DESC;");
}

function filterProducts(type, manufacturers, minPrice, maxPrice){
    return client.query("SELECT * FROM product WHERE available_quantity > 0 AND NOT is_hidden AND type='" + type +
        "' AND price*(100-discount)/100>=" + minPrice +
        " AND price*(100-discount)/100<=" + maxPrice +
        " AND manufacturer=ANY('" + manufacturers +
        "') ORDER BY discount DESC;");
}

//AND manufacturer=ANY(" + manufacturers + ")
function getManufacturers(type){
    return client.query("SELECT DISTINCT manufacturer FROM product WHERE type = '" + type + "';");
}

function quantityUpdate(quantity, uid, pid) {
    return client.query("UPDATE cart SET product_quantity=" + quantity + " WHERE user_id=" + uid +" AND product_id=" + pid);
}

// function getPrices(type){
//     return client.query("SELECT price, discount FROM product WHERE type = '" + type + "';");
// }

function getParts(){
    return client.query("SELECT * FROM category");
}

function getProduct(id){
    return client.query("SELECT * FROM product WHERE id = " + id + ";");
}

function getType(type){
    return client.query("SELECT * FROM product WHERE type = '" + type + "' AND available_quantity > 0 AND NOT is_hidden ORDER BY discount DESC;");
}

function getCart(id){
    return client.query("SELECT cart.product_id, SUM(cart.product_quantity), product.name, product.price, product.discount FROM cart INNER JOIN product ON cart .product_id = id WHERE user_id = " + id + " GROUP BY cart.product_id, product.name, product.price, product.discount;");
}

function addToCart(user, product, quantity){
    return client.query("INSERT INTO cart (user_id, product_id, product_quantity) VALUES (" + user + "," + product + "," + quantity + ");");
}

function rmCart(uid, pid) {
    return client.query("DELETE FROM cart WHERE user_id = " + uid + "AND product_id = " + pid + ";");
}

function userDataCheckout(uid) {
    return client.query("SELECT id, email, first_name, last_name, address, phone FROM users WHERE id=" + uid + ";");
}

function checkUuid(hash) {
    return client.query("SELECT email FROM email_verification WHERE account_verifiction=" + hash + ";");
}

function verifyUser(email) {
    return client.query("UPDATE users SET is_verified = 't' WHERE email=" + email+ ";");
}

function checkVerification(email) {
    return client.query("SELECT is_verified FROM users WHERE email=" + email + ";");
}


function checkout(uid) {
    return client.query(";");
}

function partsRender(products, req){
    if (!(req.session.user && req.cookies.user_sid)) {
        products["command"] = '';
    }
    products.rows.forEach(function (product, index, rows) {
        if(product["discount"]>0)
            rows[index]["available_quantity"] = '';
    });
    products.rows.forEach(function (product, index, rows) {
        if(product["discount"])
            rows[index]["discount"] = product["price"] * (100 - product["discount"]) / 100;
        else
            rows[index]["discount"] = rows[index]["price"];
    });
    products.oid = req.param('type');
    //console.log(products);
    return products;
}


// generator.on('token', function(token){
//     console.log('New token for %s: %s', token.user, token.accessToken);
// });

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bitaka.ecommerce@gmail.com',
        pass: 'roottoor'
    }
});


function accountConfirmEmail(last_name, email) {
    var uuid = guid();
    let hash = bcrypt.hashSync(uuid, 10);
    client.query("INSERT INTO email_verification (user_email, account_verifiction) VALUES (" + email + ', ' + hash + ');');
    var mailOptions = {
        from: 'rumen@arc-global.com',
        to: email,
        subject: 'Account Confirmation - Bitaka.bg',
        text: 'Welcome to Bitaka.bg. In order to use your account you need to activate it first: ' + 'http://localhost:3000/emailConfirmation?uuid=' + uuid
    };
    console.log(sendMail(mailOptions));
}

// TO DO
//
// function forgotPasswordEmail() {
//     // Setup mail configuration
//     var mailOptions = {
//         from: 'rumen@arc-global.com',
//         to: "RECEIVER_EMAIL",
//         subject: 'Account Confirmation for Bitaka.bg',
//         // text: '', // plaintext body
//         html: htmlBody // html body
//     };
//     console.log(sendMail(mailOptions));
// }
//
// function changedPasswordEmail() {
//     // Setup mail configuration
//     var mailOptions = {
//         from: 'rumen@arc-global.com',
//         to: "RECEIVER_EMAIL",
//         subject: 'Account Confirmation for Bitaka.bg',
//         // text: '', // plaintext body
//         html: htmlBody // html body
//     };
//     console.log(sendMail(mailOptions));
// }


function sendMail(mailOptions) {
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
            return {
                status: 'error',
                msg: 'Email sending failed'
            };
        } else {
            console.log('Message %s sent: %s', info.messageId, info.response);
            return {
                status: 'ok',
                msg: 'Email sent'
            };
        }
        smtpTransport.close();
    });
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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