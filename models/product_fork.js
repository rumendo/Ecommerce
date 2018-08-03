/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('product_fork', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'product',
        key: 'id'
      }
    },
    travel: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    hub_size: {
      type: DataTypes.STRING,
      allowNull: false
    },
    headset: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'product_fork'
  });
};
