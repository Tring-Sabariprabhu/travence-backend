import db from '../../dbconnect.js'
import groupMemberResolvers from "./groupMemberResolvers.js";
import { setMailAndSend } from '../../Helper/mailing/mailing.js';
export default {
    Query: {
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
    Mutation: {
        resendGroupJoinRequests: async (_, { admin_id, requestIDs }) => {
            try {
                if (requestIDs.length === 0) {
                    throw new Error("No Requests found");
                }
                const adminInGroup = await groupMemberResolvers.Query.group_member(_, { member_id: admin_id });
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
                        setMailAndSend(
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
                const adminInGroup = await groupMemberResolvers.Query.group_member(_, { member_id: admin_id });
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
                const adminInGroup = await groupMemberResolvers.Query.group_member(_, { member_id: admin_id });
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

                    setMailAndSend(
                        {
                            destinationEmail: email,
                            subject: "Invite to Join Group in Travence",
                            message:
                                (registered ?
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
                const adminInGroup = await groupMemberResolvers.Query.group_member(_, { member_id: admin_id });
                if (adminInGroup) {
                    const { rows: MemberExists } = await db.query(`SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`, [adminInGroup?.group_id, user_id]);
                    if (MemberExists[0]?.member_id === null || MemberExists[0]?.deleted_at !== null) {
                        await groupMemberResolvers.Mutation.addUserToGroup(_, { group_id: adminInGroup?.group_id, user_id: user_id });
                        const { rows: user } = await db.query(`SELECT * FROM users WHERE user_id = $1`, [user_id]);
                        await db.query(`DELETE FROM group_requests WHERE requested_by IN (SELECT member_id FROM group_members WHERE group_id = $1 AND email = $2)`, [adminInGroup?.group_id, user[0]?.email]);
                    } else {
                        throw new Error("You are already in that Group");
                    }
                } else {
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
            try {
                await db.query(`UPDATE group_requests SET status = $1 WHERE request_id = $2`, ['rejected', request_id]);
                return "Declined Successfully";
            }
            catch (err) {
                console.log(err?.message);
                throw new Error("Decline Group Join request failed ", err?.message);
            }
        },
    }
}
