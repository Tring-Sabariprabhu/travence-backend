
import CryptoJS from 'crypto-js' 
import dotenv from 'dotenv';
dotenv.config();

export const encryptPassword = (password) => {
  if(process.env.CRYPTO_KEY)
    return CryptoJS.AES.encrypt(password, process.env.CRYPTO_KEY).toString();
};

export const decryptPassword = (encryptedPassword) => {
  if(process.env.CRYPTO_KEY){
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, process.env.CRYPTO_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
};
