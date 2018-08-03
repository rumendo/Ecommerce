/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('product_wheels', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'product',
        key: 'id'
      }
    },
    diameter: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    hub: {
      type: DataTypes.STRING,
      allowNull: false
    },
    spokes: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'product_wheels'
  });
};
