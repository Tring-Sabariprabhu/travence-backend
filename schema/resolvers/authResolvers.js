import {decryptPassword, encryptPassword} from '../../Helper/hashing/hashing.js';
import jwt from 'jsonwebtoken';
import db from '../../dbconnect.js';
import dotenv from 'dotenv';
dotenv.config();

export default  {
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
          }
    }
};

