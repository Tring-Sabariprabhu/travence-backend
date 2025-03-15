'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert groups data
    await queryInterface.bulkInsert('groups', [
      {
        group_id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Developers',
        description: 'A group for developers',
        created_by: Sequelize.literal(`(SELECT user_id FROM users WHERE email = 'demo1@gmail.com')`),
        created_at: new Date(),
      },
    
    ]);

    // Insert group members
    await queryInterface.bulkInsert('group_members', [
      {
        member_id: Sequelize.literal('uuid_generate_v4()'),
        user_id: Sequelize.literal(`(SELECT user_id FROM users WHERE email = 'demo1@gmail.com')`),
        group_id: Sequelize.literal(`(SELECT group_id FROM groups WHERE name = 'Developers')`),
        role: 'admin',
        joined_at: new Date(),
      },
      {
        member_id: Sequelize.literal('uuid_generate_v4()'),
        user_id: Sequelize.literal(`(SELECT user_id FROM users WHERE email = 'demo2@gmail.com')`),
        group_id: Sequelize.literal(`(SELECT group_id FROM groups WHERE name = 'Developers')`),
        role: 'member',
        joined_at: new Date(),
      },
      {
        member_id: Sequelize.literal('uuid_generate_v4()'),
        user_id: Sequelize.literal(`(SELECT user_id FROM users WHERE email = 'demo3@gmail.com')`),
        group_id: Sequelize.literal(`(SELECT group_id FROM groups WHERE name = 'Developers')`),
        role: 'member',
        joined_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('group_members', null, {});
    await queryInterface.bulkDelete('groups', null, {});
  }
};
