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
var sha256 = require('js-sha256');

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
        console.log(products);
        if (!(req.session.user && req.cookies.user_sid)) {
            products["command"] = '';
        }
        products.rows.forEach(function (product, index, rows) {
            rows[index]["discount"] = product["price"] * (100-product["discount"]) / 100;
            rows[index]["discount"] = rows[index]["discount"].toFixed(2);
        });
        res.render('homepage', products);
    });
});


// route for viewing contents of a order
app.get('/admin/orders/changeStatusCode', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }
    console.log(req.param('code'));
    console.log(req.param('oid'));
    changeStatusCode(req.param('oid'), req.param('code'))
        .then(function (orders) {
            console.log(orders);
            res.render('admin_orders', orders);
        })
        .catch(error => {
            console.log(error);
        });

});


// route for viewing contents of a order
app.get('/admin/orders/order', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    orderDetails(req.param('id'))
        .then(function (products) {
            console.log(products);
            res.render('admin_order_products', products);
        })
        .catch(error => {
            console.log(error);
        });

});


// route for canceling orders
app.get('/admin/orders/cancel', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    cancelOrder(req.param('id'))
        .then(function (orders) {
            res.render('admin_orders', orders);
        })
        .catch(error => {
            console.log(error);
        });

});


// route for managing orders
app.get('/admin/orders', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }
    if(req.param('uid')) {
        getUserOrders(req.param('uid'))
            .then(function (orders) {
                console.log(orders);
                res.render('admin_orders', orders);
                return;
            })
            .catch(error => {
                console.log(error);
            });
        return;
    }

    getAllOrders()
        .then(function (orders) {
            console.log(orders);
            res.render('admin_orders', orders);
        })
        .catch(error => {
            console.log(error);
        });

});


// route for adding products
app.route('/admin/products/addProduct')
    .get((req, res) => {
        if (!req.session.user.is_admin) {
            res.render('error');
            return;
        }
        res.render('admin_addProduct');
    })
    .post((req, res) => {
        if (!req.session.user.is_admin) {
            res.render('error');
            return;
        }
        if(req.param("is_hidden"))
            var is_hidden = 'true';
        else
            var is_hidden = 'false';

        console.log(req.param("name"));
        console.log(req.param("price"));
        console.log(req.param("discount"));
        console.log(req.param("short_desc"));
        console.log(req.param("long_desc"));
        console.log(req.param("available_quantity"));
        console.log(req.param("type"));
        console.log(req.param("manufacturer"));
        console.log(req.param("is_hidden"));
        console.log(req.param("img"));
        lastProduct()
            .then(function (result) {
                result.rows[0].max++;
                addProduct(result.rows[0].max, req.param("name"), req.param("price"), req.param("discount"), req.param("short_desc"), req.param("long_desc"), req.param("available_quantity"), req.param("type"), req.param("manufacturer"), is_hidden, "/images/" + req.param("img"))
                    .then(function (result) {
                        //if success say so
                        console.log(result);
                        res.redirect('/admin/products');
                    })
                    .catch(error => {
                        console.log(error);
                    });
            })
            .catch(error => {
                console.log(error);
            });

    });


// route for removing products
app.get('/admin/products/rmProduct', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    rmProduct(req.param('rmProduct'))
        .then(function (result) {
            console.log(result);
            res.redirect('/admin/products');
        })
        .catch(error => {
            console.log(error);
        });
});

// route for showing a product
app.get('/admin/products/show', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    showProduct(req.param('show'))
        .then(function (result) {
            console.log(result);
            res.redirect('/admin/products');
        })
        .catch(error => {
            console.log(error);
        });
});

// route for hiding a product
app.get('/admin/products/hide', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    hideProduct(req.param('hide'))
        .then(function (result) {
            console.log(result);
            res.redirect('/admin/products');
        })
        .catch(error => {
            console.log(error);
        });
});

// route for managing products
app.get('/admin/products', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    getAllProducts()
        .then(function (products) {
            res.render('admin_products', products);
        })
        .catch(error => {
            console.log(error);
        });
});

// route for granting admin right
app.get('/admin/users/makeAdmin', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    makeAdmin(req.param('makeAdmin'))
        .then(function (result) {
            console.log(result);
            res.redirect('/admin/users');
        })
        .catch(error => {
            console.log(error);
        });
});

// route for removing admin right
app.get('/admin/users/rmAdmin', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    rmAdmin(req.param('rmAdmin'))
        .then(function (result) {
            console.log(result);
            res.redirect('/admin/users');
        })
        .catch(error => {
            console.log(error);
        });
});

// route for removing users
app.get('/admin/users/rmUser', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    rmUser(req.param('rmUser'))
        .then(function (result) {
            console.log(result);
            res.redirect('/admin/users');
        })
        .catch(error => {
            console.log(error);
        });
});

// route for managing users
app.get('/admin/users', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    getAllUsers()
        .then(function (users) {
            res.render('admin_users', users);
        })
        .catch(error => {
            console.log(error);
        });

});

// route for admin menu
app.get('/admin', (req, res) => {
    console.log(req.session.user);
    if (!req.session.user.is_admin) {
        res.render('error');
        return;
    }

    res.render('admin');

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
    getManufacturers(req.param('type')).then(function (allManufacturers) {
        var minPrice = req.param('minPrice');
        var maxPrice = req.param('maxPrice');
        var manufacturers = "";
        if(req.param('manufacturer')) {
            manufacturers = req.param('manufacturer');
            manufacturers = JSON.stringify(manufacturers);
            manufacturers = '{' + manufacturers.slice(1);
            manufacturers = manufacturers.slice(0, -1) + '}';
        }else {
            manufacturers = '{';
            allManufacturers.rows.forEach(function (manufacturer) {
                console.log(manufacturer.manufacturer);
                manufacturers += '"' + manufacturer.manufacturer + '", ';
            });
            manufacturers = manufacturers.slice(0, -2) + '}';
        }
        if(!minPrice)
            minPrice = '0';
        if(!maxPrice)
            maxPrice = '2147483647';

        console.log(manufacturers);

        filterProducts(req.param('type'), manufacturers, minPrice, maxPrice)
            .then(function (products) {
            console.log(products);
            res.render('fork', partsRender(products, req));
            })
            .catch(error => {
                console.log(error);
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
            if(response.rowCount){
                product.addCart = "True";
            }
            res.render('product', product);
        });
    });
});

// route for deleting product from cart

app.post('/rmCart', function(req, res){
    rmCart(req.session.user.id, req.param('pid')).then(function (product) {
        if (!(req.session.user && req.cookies.user_sid)) {
            product["command"] = '';
        }
        res.redirect('/cart');
    });
});

// route for cart page
app.get('/cart', (req, res) => {
    getCart(req.session.user.id).then(function (products) {
        if (!(req.session.user && req.cookies.user_sid)) {
            products["command"] = '';
        }
        console.log(products);
        if(!products.rowCount){
            res.render('cart', products);
            return;
        }

        products.rows.forEach(function (product, index, rows) {
            rows[index]["price"] = product["price"] * product["sum"] * (100-product["discount"]) / 100;
            products.oid += rows[index]["price"];
            rows[index]["price"] = rows[index]["price"].toFixed(2);
        });
        products.oid = products.oid.toFixed(2);
        console.log(products);
        res.render('cart', products);
    });
});

app.get('/quantityUpdate', function (req, res) {
    quantityUpdate(req.param('quantity'), req.session.user.id, req.param('pid')).then(function (price) {
        res.send(price);
    })
});

app.get('/admin/products/availableQuantityUpdate', function (req, res) {
    availableQuantityUpdate(req.param('available_quantity'), req.param('pid'))
        .then(function (price) {
        res.send(price);
    })
        .catch(error => {
            console.log(error);
        });
});

app.route('/checkout')
    .get((req, res) => {
        console.log("checkin out");
        userDataCheckout(req.session.user.id).then(function (user) {
            if (!(req.session.user && req.cookies.user_sid)) {
                user["command"] = '';
            }
            res.render('checkout', user);
        });
    })
    .post((req, res) => {
        getCart(req.session.user.id)
            .then(function (cart) {
                lastOrder()
                    .then(function (oid) {
                        cart.rows.forEach(function (product, index, rows) {
                            rows[index]["price"] = product["price"] * product["sum"] * (100-product["discount"]) / 100;
                            cart.oid += rows[index]["price"];
                            // rows[index]["price"] = rows[index]["price"].toFixed(2);
                        });
                        console.log(cart);
                        oid.rows[0].max++;
                        cart.rows.forEach(function (product) {
                            console.log("INSERT INTO orders (id, user_id, product_id, product_quantity, product_price, address, phone, status_code) VALUES (" + oid + ", " + req.session.user.id + ", " + product.product_id + ", " + product.sum + ", " + product.price + ", '" + req.body.address + "', '" + req.body.phoneNumber + "', " + 1 + ");");
                            checkout(oid.rows[0].max, req.session.user.id, product.product_id, product.sum, product.price, req.body.address, req.body.phoneNumber, 1)
                                .then(function (result) {
                                    console.log(result);
                                    res.redirect('/');
                                    delCart(req.session.user.id);
                                    return;
                                })
                                .catch(error => {
                                    console.log(error);
                                });
                        });
                    })
                    .catch(error => {
                        console.log(error);
                    });

            })
            .catch(error => {
                console.log(error);
            });
        return;
    });


// route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.render('signup');
    })
    .post((req, res) => {
        console.log(req.body);
        if(req.body.password != req.body.passwordConfirm) {
            res.render('signup', {
                error: "Password mismatch"
            });
            return;
        }
        checkEmailDuplicate(req.body.email).then(function (result) {
            console.log(result);
            if(result.rows[0].exists){
                res.render('signup', {
                    error: "A user with the email address you specified already exists"
                });
                return;
            }
        });
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
                res.redirect('/login?registered=1');
            })
            .catch(error => {
                res.redirect('/error');
            });
    });


// route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        console.log(req.param('id'));
        if(req.param('registered')){
            res.render('login', {
                id : req.param('id'),
                registered: true
            });
        } else {
            res.render('login', {id:req.param('id')});
        }
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
                            return;
                        }
                        res.redirect('/');
                        return;
                    }
                });
            }else {
                res.render('login', {
                    error: "You need to activate account before logging in. You can find the activation link in your email inbox or spam folder."
                });
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

// route for email confirmation
app.get('/emailConfirmation', (req, res) => {
    console.log(req.param('uuid'));
    let hash = sha256(req.param('uuid'));
    console.log(hash);
    checkUuid(hash).then(function (result) {
        console.log(result);
        if(result.rowCount) {
            verifyUser(result.rows[0].user_email).then(function (is_verified) {
                if(is_verified.rowCount) {
                    res.redirect('/');
                } else
                    res.redirect('/error');
            });
        }
    })
        .catch(error =>  {
            console.log(error);
        });
});

// route for reset password confirmation
app.post('/resetPassword', (req, res) => {
    console.log(req.param('email'));
    accountPasswordReset(req.param('email'));
    res.render('login', {
        error: 'Check your email..'
    });
});


// route for setting a new password
app.get('/newPassword', (req, res) => {
    console.log(req.param('uuid'));
    let hash = sha256(req.param('uuid'));
    console.log(hash);

    checkUuidTimestamp(hash)
        .then(function (result) {
            var time = new Date();
            if(time.getTime() - result.rows[0].time < 3600) { // Compare to current time
                checkUuidPassword(hash).then(function (result) {
                    console.log(result);
                    if (result.rowCount) {
                        res.render('resetPassword', result);
                    } else
                        res.redirect('/error');
                })
                    .catch(error => {
                        console.log(error);
                    });
            } else{
                deleteForgotPasswordUuid(hash)
                    .then(function (result) {
                        res.render('login', {
                            error : "Password reset link has expired"
                        });
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }
        })
        .catch(error => {
                console.log(error);
        });
});

// route for setting the new password
app.post('/setNewPassword', (req, res) => {
    if(req.param('password') != req.param('confirmPassword')) {
        res.render('resetPassword', {
            error: "Password mismatch!"
        });
        return;
    }
    bcrypt.hash(req.param('password'), 10, function(err, hash) {
        setNewPassword(req.param('email'), hash)
            .then(function (result) {
                passwordChangedEmail(req.param('email'));
                deleteForgotPasswordUuid(hash);
                res.render('login');
            })
            .catch(error => {
                console.log(error);
            });
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

function lastProduct() {
    return client.query("SELECT MAX(id) FROM product");
}

function addProduct(id, name, price, discount, short_desc, long_desc, available_quantity, type, manufacturer, is_hidden, img) {
    return client.query("INSERT INTO product (id, name, price, discount, short_desc, long_desc, img_path, available_quantity, type, manufacturer, is_hidden) VALUES (" + id +" , '" + name + "', " + price + ", " + discount + ", '" + short_desc + "', '" + long_desc + "', '" + img + "', " + available_quantity + ", '" + type + "', '" + manufacturer + "', '" + is_hidden + "');");
}

function rmProduct(pid) {
    return client.query("DELETE FROM product WHERE id = " + pid + ";");
}

function showProduct(pid) {
    return client.query("UPDATE product SET is_hidden = 'false' WHERE id = " + pid + ";");
}

function hideProduct(pid) {
    return client.query("UPDATE product SET is_hidden = 'true' WHERE id = " + pid + ";");
}

function makeAdmin(uid) {
    return client.query("UPDATE users SET is_admin = 'true' WHERE id = " + uid + ";");
}

function rmAdmin(uid) {
    return client.query("UPDATE users SET is_admin = 'false' WHERE id = " + uid + ";");
}

function rmUser(uid) {
    return client.query("DELETE FROM users WHERE id = " + uid + ";");
}

function getAllUsers() {
    return client.query("SELECT * FROM users;");
}

function getAllProducts() {
    return client.query("SELECT * FROM product;");
}

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
    return client.query("UPDATE cart SET product_quantity=" + quantity + " WHERE user_id=" + uid +" AND product_id=" + pid + ";");
}

function availableQuantityUpdate(quantity, pid) {
    return client.query("UPDATE product SET available_quantity=" + quantity + " WHERE id=" + pid + ";");
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
    return client.query("SELECT cart.product_id, SUM(cart.product_quantity), product.name, product.price, product.discount FROM cart INNER JOIN product ON cart.product_id = product.id WHERE user_id = '" + id + "' GROUP BY cart.product_id, product.name, product.price, product.discount;");
}

function addToCart(user, product, quantity){
    return client.query("INSERT INTO cart (user_id, product_id, product_quantity) VALUES (" + user + "," + product + "," + quantity + ");");
}

function rmCart(uid, pid) {
    return client.query("DELETE FROM cart WHERE user_id = " + uid + "AND product_id = " + pid + ";");
}

function delCart(uid) {
    return client.query("DELETE FROM cart WHERE user_id = " + uid + ";");
}

function userDataCheckout(uid) {
    return client.query("SELECT id, email, first_name, last_name, address, phone FROM users WHERE id=" + uid + ";");
}

function checkEmailDuplicate(email) {
    return client.query("SELECT EXISTS(SELECT 1 FROM users WHERE email='" + email + "')");
}

function addUuid(email, hash) {
    return client.query("INSERT INTO email_verification (user_email, account_verification) VALUES ('" + email + "', '" + hash + "');");
}

function addUuidPassword(email, time, hash) {
    return client.query("INSERT INTO forgot_password (user_email, time, password_verification) VALUES ('" + email + "', '" + time + "', '" + hash + "');");
}

function checkUuid(hash) {
    return client.query("SELECT user_email FROM email_verification WHERE account_verification='" + hash + "';");
}

function checkUuidTimestamp(hash) {
    return client.query("SELECT EXTRACT(epoch FROM time) AS time FROM forgot_password WHERE password_verification='" + hash + "';");
}

function checkUuidPassword(hash) {
    return client.query("SELECT user_email FROM forgot_password WHERE password_verification='" + hash + "';");
}

function deleteForgotPasswordUuid(hash) {
    return client.query("DELETE FROM forgot_password WHERE password_verification='" + hash + "';");
}

function setNewPassword(email, hash) {
    return client.query("UPDATE users SET password = '" + hash + "' WHERE email='" + email+ "';");
}

function verifyUser(email) {
    return client.query("UPDATE users SET is_verified = 't' WHERE email='" + email+ "';");
}

function checkVerification(email) {
    return client.query("SELECT is_verified FROM users WHERE email='" + email + "';");
}

function lastOrder() {
    return client.query("SELECT MAX(id) FROM orders");
}

function checkout(oid, uid, pid, qty, price, address, phone, code) {
    return client.query("INSERT INTO orders (id, user_id, product_id, product_quantity, product_price, address, phone, status_code) VALUES (" + oid + ", " + uid + ", " + pid + ", " + qty + ", " + price + ", '" + address + "', '" + phone + "', " + code + ");");
}

function getAllOrders() {
    return client.query("SELECT id, user_id, SUM(product_price) as product_price, address, phone, status_code FROM orders GROUP BY id, user_id, address, phone, status_code;");
}

function getUserOrders(uid) {
    return client.query("SELECT id, user_id, SUM(product_price) as product_price, address, phone, status_code FROM orders WHERE user_id =" + uid + " GROUP BY id, user_id, address, phone, status_code;");
}

function cancelOrder(oid) {
    return client.query("DELETE FROM orders WHERE id = " + oid + ";");
}

function orderDetails(oid) {
    return client.query("SELECT * FROM orders WHERE id = " + oid + ";");
}

function changeStatusCode(oid, code) {
    return client.query("UPDATE orders SET status_code = '" + code + "' WHERE id = " + oid + ";");
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
        rows[index]["discount"] = rows[index]["discount"].toFixed(2);
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
    console.log("Gen uuid:"+uuid);
    let hash = sha256(uuid);

    console.log("Gen hash:"+hash);
    addUuid(email, hash)
        .then(function (result) {
            var mailOptions = {
                from: 'bitaka.ecommerce@gmail.com',
                to: email,
                subject: 'Account Confirmation - Bitaka.bg',
                text: 'Welcome to Bitaka.bg. In order to use your account you need to activate it first: ' + 'http://localhost:3000/emailConfirmation?uuid=' + uuid
            };
            console.log(sendMail(mailOptions));
        })
        .catch(error => {
            console.log(error);
        });

}

function accountPasswordReset(email) {
    var uuid = guid();
    console.log("Gen uuid:"+uuid);
    let hash = sha256(uuid);
    var time = new Date().toUTCString();
    console.log(time);
    console.log("Gen hash:"+hash);
    addUuidPassword(email, time, hash)
        .then(function (result) {
            var mailOptions = {
                from: 'bitaka.ecommerce@gmail.com',
                to: email,
                subject: 'Password Reset - Bitaka.bg',
                text: 'Reset your password for Bitaka.bg: ' + 'http://localhost:3000/newPassword?uuid=' + uuid
            };
            console.log(sendMail(mailOptions));
        })
        .catch(error => {
            console.log(error);
        });
}

function passwordChangedEmail(email) {
    var time = new Date();
    var mailOptions = {
        from: 'bitaka.ecommerce@gmail.com',
        to: email,
        subject: 'Password Reset - Bitaka.bg',
        text: 'Your password has been reset at ' + time
    };
    console.log(sendMail(mailOptions));
}


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