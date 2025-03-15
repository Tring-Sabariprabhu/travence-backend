'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.UUID, 
        defaultValue: Sequelize.literal('uuid_generate_v4()'),        
        allowNull: false,
        primaryKey: true,   
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,      
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,     
        unique: true,         
        validate: {
          isEmail: true,      
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,    
      },
      registered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,  
        allowNull: false,     
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,      
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,     
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users'); // Properly dropping the table
  }
};


