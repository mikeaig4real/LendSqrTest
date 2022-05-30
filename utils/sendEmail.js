require('dotenv').config();
const nodemailer = require('nodemailer');
const nodemailerConfig = require('./nodemailerConfig');
const mailGunConfig = require('./mailgunConfig');
const mailgun = require("mailgun-js");

const sendEmail = async ({ to, subject, html, type }) => {
  // let testAccount = await nodemailer.createTestAccount();

  if (type === 'nodemailer') {
    // use nodemailer
    const transporter = nodemailer.createTransport(nodemailerConfig);

    return transporter.sendMail({
      from: '"ReactHQ" <hi@reactng.com>',
      to,
      subject,
      html,
    });
  };

  if (type === 'mailgun') {
    // use mailgun
    const mg = mailgun(mailGunConfig);

    return mg.messages().send({
      from: 'ReactHQ <hi@reactng.com>',
      to,
      subject,
      html,
    });
  };

  if (type === 'sendgrid') {
    // use sendgrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    return sgMail.send({
      to,
      from: 'ReactHQ <hi@reactng.com>',
      subject,
      html,
    });
  };


  if (type === 'mailchimp') {
    // use mailchimp
    const mailchimp = require('mailchimp-api-v3');
    const mailchimpConfig = require('./mailchimpConfig');
    const mc = new mailchimp(mailchimpConfig);

    return mc.post('/lists/a0a9d0f8b8/members', {
      email_address: to,
      status: 'subscribed',
      merge_fields: {
        FNAME: '',
        LNAME: '',
      },
    });
  };
};

module.exports = sendEmail;
