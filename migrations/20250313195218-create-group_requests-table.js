'use strict';

const { type } = require("os");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('group_requests', {
      request_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
        allowNull: false,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      requested_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'group_members',  
          key: 'member_id',  
        },
        onDelete: 'CASCADE'  
      },
      user_registered: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,  
        allowNull: false,     
      },
      requested_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
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
