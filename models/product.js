var Sequelize = require('sequelize');

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

// setup Product model and its fields.
var product = sequelize.define('product', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    price: {
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    discount: {
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    short_desc: {
      type: Sequelize.STRING,
      allowNull: false
    },
    long_desc: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    img_path: {
      type: Sequelize.STRING,
      allowNull: false
    },
    available_quantity: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    manufacturer: {
      type: Sequelize.STRING,
      allowNull: false
    },
    is_hidden: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

module.exports = product;