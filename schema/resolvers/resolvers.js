import db from '../../dbconnect.js'
import { decryptPassword, encryptPassword } from '../../Helper/hashing/hashing.js';
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import { setMailOptions } from '../../Helper/mailing/mailing.js';


export const resolvers = {
    Query: {
        getAuthUser: async (_, child, user) => {
            try {
                if (!user) {
                    throw new Error('Unauthorized');
                }
                const user_id = user?.decoded?.user_id;
                if(!user_id || user_id === "")
                        throw new Error("User ID not found in token");
                const { rows } = await db.query(`SELECT * FROM users WHERE user_id = $1 AND deleted_at IS NULL`, [user_id]);
                if (rows?.length === 0) {
                    throw new Error('User not found');
                }
                return rows[0];
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Fetching User Data failed ", err?.message);
            }

        },
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
        getGroupInvitedList: async (_, { admin_id }) => {
            try {
                const { rows: requests } = await db.query(`SELECT * FROM group_requests WHERE requested_by = $1`, [admin_id]);
                return requests;
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group Invitaion Fetching failed ", err.message);
            }
        },
        getGroupJoinRequestsForUser: async (_, { email }) => {
            try {
                const { rows: requests } = await db.query(`
                    SELECT gr.*, g.name AS group_name, u.name AS admin_name FROM group_requests gr 
                    INNER JOIN group_members gm 
                        ON gr.requested_by = gm.member_id 
                    INNER JOIN groups g
                        ON gm.group_id = g.group_id 
                    INNER JOIN users u
                        ON gm.user_id = u.user_id 
                    WHERE gr.email = $1 AND gr.status = $2`, [email, 'requested']);
                return requests;
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Group Join Requests fetching failed ", err.message);
            }

        }
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
        signin: async (_, { email, password }) => {
            try {
                const { rows: userExists } = await db.query(`SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`, [email]);
                if (userExists?.length > 0) {
                    const decryptedPassword = decryptPassword(userExists[0]?.password);
                    if (password === decryptedPassword) {
                        const user_id = userExists[0]?.user_id;
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
                console.log(err.message);
                throw new Error("Signin Failed " + err?.message);
            }
        },
        signup: async (_, { name, email, password }) => {
            try {
                const { rows: userEmailExists } = await db.query(`SELECT * FROM group_requests WHERE email = $1`, [email]);
                if (userEmailExists[0]) {
                    await db.query(`UPDATE group_requests SET user_registered = $1 WHERE email = $2`, [true, email]);
                }
                const { rows: userExists } = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);

                if (userExists?.length === 0) {  // New user
                    const hashedPassword = encryptPassword(password);
                    const { rows: register } = await db.query(`INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING user_id`, [name, email, hashedPassword]);
                    const user_id = register[0]?.user_id;
                    const token = jwt.sign({ user_id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }); // Token expires in 1 hour
                    return {
                        token: token,
                        user_id: user_id
                    };
                } else if (userExists[0]?.deleted_at !== null) {  // Deleted User as New
                    const hashedPassword = encryptPassword(password);
                    const { rows: register } = await db.query(`
                        UPDATE users SET name = $1, password = $2, deleted_at = NULL 
                            WHERE email = $3 RETURNING user_id`, [name, hashedPassword, email]);

                    const user_id = register[0]?.user_id;
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
                console.log(err.message);
                throw new Error("Signup Failed " + err?.message);
            }
        },
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
                const adminInGroup = await resolvers.Query.group_member(_, { member_id: admin_id });
                if (!adminInGroup || adminInGroup?.deleted_at !== null) {
                    throw new Error("Access denied! You are Removed From this Group");
                }
                const user = await resolvers.Query.group_member(_, { member_id: member_id });
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
                const adminInGroup = await resolvers.Query.group_member(_, { member_id: admin_id });
                if (!adminInGroup || adminInGroup?.deleted_at !== null) {
                    throw new Error("Access denied! You are Removed From this Group");
                }
                const user = await resolvers.Query.group_member(_, { member_id: member_id });
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
        resendGroupJoinRequests: async (_, { admin_id, requestIDs }) => {
            try {
                if (requestIDs.length === 0) {
                    throw new Error("No Requests found");
                }
                const adminInGroup = await resolvers.Query.group_member(_, { member_id: admin_id });
                if (!adminInGroup || adminInGroup?.deleted_at !== null) {
                    throw new Error("Access denied! You are Removed From this Group");
                }
                // Get group name and admin email , name for sending email
                const { rows: groupdata } = await db.query(`SELECT name FROM groups WHERE group_id = $1`, [adminInGroup?.group_id]);
                const { rows: adminProfile } = await db.query(`SELECT email, name FROM users WHERE user_id = $1`, [adminInGroup?.user_id]);
                for (const requestID of requestIDs) {
                    const { rows: requestRecord } = await db.query(`UPDATE group_requests SET requested_at = CURRENT_TIMESTAMP, status = $1 WHERE request_id = $2 RETURNING email`, ['requested', requestID]);
                    const email = requestRecord[0]?.email;
                    if (email) {
                        setMailOptions(
                            {
                                destinationEmail: email,
                                subject: "Invite to Join Group in Travence",
                                message: `You have been invited by ${adminProfile[0]?.name} to join the Group "${groupdata[0]?.name}" on Travence!`
                            });
                    }

                }
                return "Invite Resent Successfully";
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Resending Group Join Requests failed ", err.message);
            }
        },
        deleteGroupJoinRequests: async (_, { admin_id, requestIDs }) => {
            try {
                if (requestIDs.length === 0) {
                    throw new Error("No Requests found");
                }
                const adminInGroup = await resolvers.Query.group_member(_, { member_id: admin_id });
                if (!adminInGroup || adminInGroup?.deleted_at !== null) {
                    throw new Error("Access denied! You are Removed From this Group");
                }
                for (const requestID of requestIDs) {
                    await db.query(`DELETE FROM group_requests WHERE request_id = $1`, [requestID]);
                }
                return "Invite Requests Deleted Successfully";
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Deleting Group Join Requests failed ", err.message);
            }
        },
        sendGroupJoinRequests: async (_, { admin_id, emails }) => {
            try {
                if (emails.length === 0) {
                    throw new Error("No Emails found");
                }
                const adminInGroup = await resolvers.Query.group_member(_, { member_id: admin_id });
                if (!adminInGroup || adminInGroup?.deleted_at !== null) {
                    throw new Error("Access denied! You are Removed From this Group");
                }
                const registeresEmails = [];

                // Get group name and admin email , name for sending email
                const { rows: groupdata } = await db.query(`SELECT name FROM groups WHERE group_id = $1`, [adminInGroup?.group_id]);
                const { rows: adminProfile } = await db.query(`SELECT email, name FROM users WHERE user_id = $1`, [adminInGroup?.user_id]);

                for (const email of emails) {
                    // Check if the user exists
                    const userResult = await db.query(
                        `SELECT user_id FROM users WHERE email = $1 AND deleted_at IS NULL`,
                        [email]
                    );

                    const user = userResult.rows[0];
                    const registered = user ? true : false;
                    // If the user Exists, then  Set registered column Value is True
                    if (registered)
                        registeresEmails.push(user?.email);

                    await db.query(
                        `INSERT INTO group_requests (email, requested_by, user_registered) 
                         VALUES ($1, $2, $3)`,
                        [email, adminInGroup?.member_id, registered]);

                    setMailOptions(
                        {
                            destinationEmail: email,
                            subject: "Invite to Join Group in Travence",
                            message: 
                            ( registered ?  
                                `<html><p>You have been invited by ${adminProfile[0]?.name} to join the group "${groupdata[0]?.name}" on Travence!</p><br>
                                <p>Click the link and Login with Travence</p><br>
                                <a href="https://2j2b6xw5-3000.inc1.devtunnels.ms/signin">Login Here</a></html>`
                                :  
                                `<p>You have been invited by ${adminProfile[0]?.name} to join the group "${groupdata[0]?.name}" on Travence!</p><br>
                                <p>Click the link to Signup with Travence</p><br>
                                <a href="https://2j2b6xw5-3000.inc1.devtunnels.ms/signup">Sign Up Here</a>`  
                                )
                            
                        });
                }
                return `Invite Sent Successfully`;
            }
            catch (err) {
                console.log(err.message);
                throw new Error("Sending Group Requests failed ", err?.message);
            }
        },
        acceptGroupJoinRequest: async (_, { admin_id, user_id }) => {
            try {
                const adminInGroup = await resolvers.Query.group_member(_, { member_id: admin_id });
                if(adminInGroup){
                    const {rows: MemberExists} = await db.query(`SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,[adminInGroup?.group_id, user_id]);
                    if(MemberExists[0]?.member_id || MemberExists[0]?.deleted_at === null){
                        await resolvers.Mutation.addUserToGroup(_,{group_id: adminInGroup?.group_id, user_id: user_id});
                        const {rows: user} = await db.query(`SELECT * FROM users WHERE user_id = $1`,[user_id]);
                        await db.query(`DELETE FROM group_requests WHERE requested_by IN (SELECT member_id FROM group_members WHERE group_id = $1 AND email = $2)`,[adminInGroup?.group_id, user[0]?.email]);
                    }else{
                        throw new Error("You are already in that Group");
                    }
                }else{
                    throw new Error("Admin not Present");
                }
                return "Joined Successfully";
            }
            catch (err) {
                console.log(err?.message);
                throw new Error("Accepting Group join request failed ", err?.message);
            }

        },
        declineGroupJoinRequest: async (_, { request_id }) => {
            try{
                await db.query(`UPDATE group_requests SET status = $1 WHERE request_id = $2`,['rejected', request_id]);
                return "Declined Successfully";
            }
            catch(err){
                console.log(err?.message);
                throw new Error("Decline Group Join request failed ", err?.message);
            }
        },
    }
}

