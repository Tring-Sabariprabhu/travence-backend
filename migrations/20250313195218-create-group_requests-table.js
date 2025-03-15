'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('group_requests', {
      request_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',  
          key: 'user_id',  
        },
        onDelete: 'CASCADE' 
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'groups', 
          key: 'group_id', 
        },
        onDelete: 'CASCADE'  
      },
      requested_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      requested_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',  
          key: 'user_id',  
        },
        onDelete: 'CASCADE'  
      },
      status: {
        type: Sequelize.ENUM('requested', 'rejected'),
        allowNull: false,
        defaultValue: 'requested' 
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('group_requests');
  }
};
