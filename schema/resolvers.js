import db from '../dbconnect.js'
import { decryptPassword, encryptPassword } from '../hashing/hashing.js';
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';


export const resolvers = {
    Query: {
        getUser: async (_, { user_id }, user) => {    
            try {
                if (!user) {
                    throw new Error('Unauthorized');
                }
                const id = user_id ? user_id : user?.decoded?.user_id;
                const userrow = await db.query(`SELECT * FROM users WHERE user_id = $1 AND registered = $2`, [id, true]);
                if (userrow?.rows?.length === 0) {
                    throw new Error('User not found');
                }
                return userrow.rows[0];
            }
            catch (err) {
                throw new Error("Fetching User Data failed ", err?.message);
            }

        },
        groupList: async (_, { user_id }) => {
            const { rows } = await db.query(`SELECT g.*, u.email as created_user_email  FROM groups g INNER JOIN users u ON u.user_id = g.created_by WHERE g.group_id IN (SELECT group_id FROM group_members WHERE user_id = '${user_id}' AND deleted_at IS NULL)`);
            return rows;
        },
        group: async (_, { group_id }) => {
            const { rows } = await db.query(`SELECT * FROM groups WHERE group_id = $1 AND deleted_at IS NULL`, [group_id]);
            return rows[0];
        },
        group_member: async (_, { member_id }) => {
            const { rows } = await db.query(`SELECT * FROM group_members WHERE member_id = $1`, [member_id]);
            return rows[0];
        },
    },
    Group: {
        group_members: async (parent, args) => {
            const { rows } = await db.query(`SELECT * FROM group_members WHERE group_id = '${parent?.group_id}' AND deleted_at IS NULL ORDER BY role DESC `);
            return rows;
        },
    },
    GroupMember: {
        profile: async (parent, args) => {
            const { rows } = await db.query(`SELECT * FROM users WHERE user_id = $1 AND registered = $2`, [parent?.user_id, true]);
            return rows[0];
        }
    },
    Mutation: {
        signin: async (_, { email, password }) => {
            try {

                const userExists = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
                if (userExists?.rows?.length > 0) {
                    const decryptedPassword = decryptPassword(userExists?.rows[0]?.password);
                    if (password === decryptedPassword) {
                        const user_id = userExists?.rows[0]?.user_id;
                        const token = jwt.sign({ user_id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }); // Token expires in 1 hour
                        return {
                            token: token,
                            user_id: user_id
                        }
                    } else {
                        throw new Error("User password Wrong");
                    }
                } else {
                    throw new Error("User not found")
                }
            }
            catch (err) {
                throw new Error("Signin Failed " + err?.message);
            }
        },
        signup: async (_, { name, email, password }) => {
            try {
                const userExists = await db.query(`SELECT * FROM users WHERE email = $1 `, [email]);
                if (userExists?.rows?.length === 0) {
                    const hashedPassword = encryptPassword(password);
                    const register = await db.query(`INSERT INTO users(name, email, password, registered) VALUES($1, $2, $3, $4) RETURNING user_id`, [name, email, hashedPassword, true]);
                    const user_id = register?.rows[0]?.user_id;
                    const token = jwt.sign({ user_id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }); // Token expires in 1 hour
                    return {
                        token: token,
                        user_id: user_id
                    };
                } else {
                    throw new Error("User already Exists");
                }
            }
            catch (err) {
                throw new Error("Signup Failed " + err?.message);
            }
        },
        createGroup: async (_, { name, description, created_by }) => {
            try {
                const { rows } = await db.query(`INSERT INTO groups(name, description, created_by) VALUES($1, $2, $3) RETURNING group_id`, [name, description, created_by]);
                try {
                    await db.query(`INSERT INTO group_members(user_id, group_id, role, joined_at) VALUES($1, $2, $3, CURRENT_TIMESTAMP)`, [created_by, rows[0]?.group_id, "admin"]);
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
                const { rows } = await db.query(`UPDATE groups SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE group_id = $3 `, [name, description, group_id]);
                return "Group Updated Successfully";
            }
            catch (err) {
                throw new Error("Group Updation failed ", err?.message);
            }
        },
        deletegroup: async (_, { group_id }) => {
            try {
                const { rows } = await db.query(`UPDATE groups SET deleted_at = CURRENT_TIMESTAMP WHERE group_id = '${group_id}'`);
                return "Group Deleted Successfully";
            }
            catch (err) {
                throw new Error("Group Deletion failed ", err?.message);
            }
        },
        addUserToGroup: async (_, { group_id, user_id, role = "member" }) => {
            try {
                const { rows: user } = await db.query(`SELECT user_id, deleted_at FROM group_members WHERE user_id = $1 AND group_id = $2`, [user_id, group_id]);
                if (user[0]?.user_id) {
                    if (user[0]?.deleted_at == null) {
                        throw new Error("User already exists with this Group");
                    } else {
                        await db.query(`UPDATE group_members SET deleted_at = NULL, role = $1 WHERE user_id = $2 AND group_id = $3`, ['member', user_id, group_id]);
                        return `User Joined Group as member Successfully`;
                    }
                } else {
                    await db.query(`INSERT INTO group_members(user_id, group_id, role, joined_at) VALUES($1, $2, $3, CURRENT_TIMESTAMP)`, [user_id, group_id, role]);
                    return `User joined Group as ${role} Successfully `;
                }
            }
            catch (err) {
                console.log(err?.message);
                throw new Error("Group Admin details Insertion failed ", err?.message);
            }
        },
        deleteUserFromGroup: async (_, { admin_id, member_id }) => {
            try {
                const admin = await resolvers.Query.group_member(_, { member_id: admin_id });
                if (admin.deleted_at === null) {
                    const group_id = admin?.group_id;
                    const user = await resolvers.Query.group_member(_, {member_id: member_id});
                    if (user) {
                        if (user?.deleted_at === null) {
                            await db.query(`UPDATE group_members SET deleted_at = CURRENT_TIMESTAMP WHERE member_id = $1`, [member_id]);
                            return "User Deleted from Group Successfully";
                        } else {
                            throw new Error("User already Deleted from Group");
                        }
                    } else {
                        throw new Error("User not Found in this Group");
                    }
                } else {
                    throw new Error("Access denied! You are Removed From this Group");
                }
            }
            catch (err) {
                console.log(err?.message)
                throw new Error("User Deletion from Group failed ", err?.message);
            }
        },
        changeRoleInGroup: async (_, { admin_id, member_id }) => {
            try {
                const admin = await resolvers.Query.group_member(_, { member_id: admin_id });
                if (admin.deleted_at === null) {
                    const group_id = admin?.group_id;
                    const user = await resolvers.Query.group_member(_, {member_id: member_id});
                    if(user){
                        if(user?.deleted_at === null){
                            const roleToChange = user?.role === "member" ? "admin" : "member";
                            const {rows} = await db.query(`UPDATE group_members SET role = $1 WHERE member_id = $2`,[roleToChange, member_id]);
                            return `Now User Role in Group ${roleToChange}`;
                        }else{
                            throw new Error("User Removed Earlier");
                        }
                    }else{
                        throw new Error("User not Found in this Group");
                    }
                } else {
                    throw new Error("Access denied! You are Removed From this Group");
                }
            }
            catch (err) {
                throw new Error("Group Role Changes failed ", err?.message);
            }
        }
    }
}

