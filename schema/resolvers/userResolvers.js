import db from '../../dbconnect.js'

export default {
    Query: {
        getAuthUser: async (_, child, user) => {
            try {
                if (!user) {
                    throw new Error('Unauthorized');
                }
                const user_id = user?.decoded?.user_id;
                if (!user_id || user_id === "")
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
    }
}
