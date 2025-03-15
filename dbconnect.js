const {Pool} = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    user: process.env.USER_NAME,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.PORT_NUMBER,
    database: process.env.DATABASE_NAME
})

module.exports = {
    query: (text, params) => pool.query(text, params)
};
