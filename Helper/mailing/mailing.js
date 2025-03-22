import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});
export const setMailOptions = ({destinationEmail, subject, message}) => {
  if(destinationEmail){
    const mailOptions = {
      from: process.env.EMAIL,
      to: destinationEmail,
      subject: subject,
      html: message
    };
  
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  }
  

}