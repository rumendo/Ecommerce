/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_entries', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    entry_date_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    entry_ip: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'user_entries'
  });
};
