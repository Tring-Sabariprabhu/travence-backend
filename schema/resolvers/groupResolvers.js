import db from '../../dbconnect.js'

export default {
    Query: {
        groupList: async (_, { user_id }) => {
            try {
                const { rows } = await db.query(`
                            SELECT g.*, u.email as created_user_email  FROM groups g
                            INNER JOIN users u 
                                ON u.user_id = g.created_by 
                            WHERE g.group_id IN 
                                (SELECT group_id FROM group_members 
                                    WHERE user_id = '${user_id}' AND deleted_at IS NULL)`);
                return rows;
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group List Fetching failed ", err.message);
            }

        },
        group: async (_, { group_id }) => {
            try {
                const { rows } = await db.query(`SELECT * FROM groups WHERE group_id = $1 AND deleted_at IS NULL`, [group_id]);
                return rows[0];
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group Details Fetching failed ", err.message);
            }

        },
    },
    Mutation: {
        createGroup: async (_, { name, description, created_by }) => {
            try {
                const { rows } = await db.query(`
                            INSERT INTO groups(name, description, created_by) 
                                VALUES($1, $2, $3) RETURNING group_id`, [name, description, created_by]);
                try {
                    await db.query(`
                                INSERT INTO group_members(user_id, group_id, role, joined_at) 
                                    VALUES($1, $2, $3, CURRENT_TIMESTAMP)`, [created_by, rows[0]?.group_id, "admin"]);
                }
                catch (err) {
                    throw new Error("Group Admin details Insertion failed");
                }
                return "Group Created Successfully";
            }
            catch (err) {
                console.log(err.message)
                throw new Error("Group Creation failed ", err?.message);
            }
        },
        updateGroup: async (_, { name, description, group_id }) => {
            try {
                const { rows } = await db.query(`
                            UPDATE groups SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
                                WHERE group_id = $3 `, [name, description, group_id]);
                return "Group Updated Successfully";
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group Updation failed ", err?.message);
            }
        },
        deletegroup: async (_, { group_id }) => {
            try {
                const { rows } = await db.query(`
                            UPDATE groups SET deleted_at = CURRENT_TIMESTAMP 
                                WHERE group_id = '${group_id}'`);
                return "Group Deleted Successfully";
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group Deletion failed ", err?.message);
            }
        },
    }
}
