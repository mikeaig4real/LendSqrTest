require('dotenv').config();
module.exports = {
  name:'mailgun',
  host:'smtp.mailgun.org',
  port:587,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD
  }
};
