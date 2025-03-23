import db from '../../dbconnect.js'
import groupMemberResolvers from "./groupMemberResolvers.js";

export default {
    Query: {
        group_member: async (_, { member_id }) => {
            try {
                const { rows } = await db.query(`SELECT * FROM group_members WHERE member_id = $1 `, [member_id]);
                return rows[0];
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group Member Fetching Error ", err.message);
            }
        },
    },
    Group: {
        group_members: async (parent, args) => {
            try {
                const { rows: members } = await db.query(`
                        SELECT gm.* FROM group_members gm 
                        INNER JOIN users u 
                            ON gm.user_id = u.user_id 
                        WHERE gm.group_id = $1 AND gm.deleted_at IS NULL AND u.deleted_at IS NULL ORDER BY gm.role DESC `, [parent?.group_id]);
                return members;
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group members fetching failed ", err.message);
            }

        },
    },
    GroupMember: {
        profile: async (parent, args) => {
            const { rows } = await db.query(`SELECT * FROM users WHERE user_id = $1 `, [parent?.user_id]);
            return rows[0];
        }
    },
    Mutation: {
        addUserToGroup: async (_, { group_id, user_id, role = "member" }) => {
            try {
                const { rows: user } = await db.query(`
                            SELECT user_id, deleted_at FROM group_members 
                                WHERE user_id = $1 AND group_id = $2`, [user_id, group_id]);
                if (user[0]?.user_id) {
                    if (user[0]?.deleted_at == null) {
                        throw new Error("User already exists with this Group");
                    } else {
                        await db.query(`
                                    UPDATE group_members SET deleted_at = NULL, role = $1 
                                        WHERE user_id = $2 AND group_id = $3`, ['member', user_id, group_id]);
                        return `User Joined Group as member Successfully`;
                    }
                } else {
                    await db.query(`
                                INSERT INTO group_members(user_id, group_id, role, joined_at) 
                                    VALUES($1, $2, $3, CURRENT_TIMESTAMP)`, [user_id, group_id, role]);
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
                const adminInGroup = await groupMemberResolvers.Query.group_member(_, { member_id: admin_id });
                if (!adminInGroup || adminInGroup?.deleted_at !== null) {
                    throw new Error("Access denied! You are Removed From this Group");
                }
                const user = await groupMemberResolvers.Query.group_member(_, { member_id: member_id });
                if (user) {
                    if (user?.deleted_at === null) {
                        await db.query(`
                                    UPDATE group_members SET deleted_at = CURRENT_TIMESTAMP 
                                        WHERE member_id = $1`, [member_id]);
                        return "User Deleted from Group Successfully";
                    } else {
                        throw new Error("User already Deleted from Group");
                    }
                } else {
                    throw new Error("User not Found in this Group");
                }

            }
            catch (err) {
                console.log(err?.message)
                throw new Error("User Deletion from Group failed ", err?.message);
            }
        },
        changeRoleInGroup: async (_, { admin_id, member_id }) => {
            try {
                const adminInGroup = await groupMemberResolvers.Query.group_member(_, { member_id: admin_id });
                if (!adminInGroup || adminInGroup?.deleted_at !== null) {
                    throw new Error("Access denied! You are Removed From this Group");
                }
                const user = await groupMemberResolvers.Query.group_member(_, { member_id: member_id });
                if (user) {
                    if (user?.deleted_at === null) {
                        const roleToChange = user?.role === "member" ? "admin" : "member";
                        await db.query(`
                                        UPDATE group_members SET role = $1 
                                            WHERE member_id = $2`, [roleToChange, member_id]);
                        return `Now User Role in Group ${roleToChange}`;
                    } else {
                        throw new Error("User Removed Earlier");
                    }
                } else {
                    throw new Error("User not Found in this Group");
                }

            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group Role Changes failed ", err?.message);
            }
        },
    }
}
