/* eslint-disable import/no-extraneous-dependencies */
const nodemailer = require('nodemailer');

const sendEmail = async (option) => {
  //for gmail
  // const transporter = nodemailer.createTransport({
  //   service: 'Gmail',
  //   auth: {
  //     user: process.env.EMAIL_USERNAME,
  //     pass: process.env.EMAIL_PASSWORD,
  //   },
  // });
  // activate in gmail "less secure app" option

  // 1 ) create a transporter
  const transporter = nodemailer.createTransport({
    // logger: true,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2 ) define the email options
  const mailOptions = {
    from: 'mahmoud <mahmoud.front.io> ',
    to: option.email,
    subject: option.subject,
    text: option.message,
  };
  // 3 ) actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
