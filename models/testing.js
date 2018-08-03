var Sequelize = require('sequelize');
var bcrypt = require('bcrypt');

var sequelize = new Sequelize('ecommerce', 'ecommerce', 'root', {
    host: 'localhost',
    dialect: 'postgres'});
sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
// setup User model and its fields.
var User = sequelize.define('users', {
    first_name: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    last_name: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    address: {
        type: Sequelize.STRING,
        unique: false,
        allowNull: false
    }
}, {
    hooks: {
        beforeCreate: (user) => {
            const salt = bcrypt.genSaltSync();
            user.password = bcrypt.hashSync(user.password, salt);
        }
    }
});
User.prototype.validPassword = function (password) {
    console.log(User);
    return bcrypt.compareSync(password, this.password);
}

// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export User model for use in other files.
module.exports = User;