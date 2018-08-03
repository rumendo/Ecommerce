/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('product_chain', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'product',
        key: 'id'
      }
    },
    gears: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'product_chain'
  });
};
