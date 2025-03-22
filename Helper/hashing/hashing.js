
import CryptoJS from 'crypto-js' 
import dotenv from 'dotenv';
dotenv.config();

export const encryptPassword = (password) => {
  if(process.env.HASH_KEY)
    return CryptoJS.AES.encrypt(password, process.env.HASH_KEY).toString();
};

export const decryptPassword = (encryptedPassword) => {
  if(process.env.HASH_KEY){
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, process.env.HASH_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
};
