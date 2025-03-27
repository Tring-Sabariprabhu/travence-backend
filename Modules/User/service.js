import db from '../../dbconnect.js';

export const getAuthUser = async (user) => {
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
        throw new Error("Fetching User Data failed ", err?.message);
    }
}
export const updateUser = async ({user_id, name, password, image})=>{
    try{
        const {rows: userData} = await db.query(`SELECT * FROM users WHERE user_id = $1`,[user_id]);
        if(userData[0]?.deleted_at === null){
            const {rows:updated} = await db.query(`UPDATE users SET name = $1, password = $2, image = $3 WHERE user_id = $4  RETURNING *`,[name, password, image, user_id]);
            if(updated[0]){
                return "User Updated Successfully";
            }else{
                throw new Error("Error in Updation");
            }
        }else{
            throw new Error("User not Found");
        }
    }
    catch(err){
        console.log(err.message);
        throw new Error("Update User failed", err.message);
    }
}