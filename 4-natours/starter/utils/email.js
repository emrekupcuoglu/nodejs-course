const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // We need to follow 3 steps in order to send mails with nodemailer
  // 1. Create a transporter
  // Transporter is a service that will actually send the email.
  // It is not Node.js that will send the email itself.
  // We are not going to use gmail but let's see it as an example
  // Reason we are not using gmail is because gmail is not a good solution for a production app.
  // Using gmail you can only send 500 mails per day and you will be marked as a spammer very quickly.
  // * Some well known ones are Mailgun, sendGrid and postmark.
  // We will use sendGrid later in the course.
  // For now we will use a special development service that fakes to send emails to real addresses
  // but in reality these emails end up trapped in a development inbox so then we can take a look how they will look in production.
  // const transporter = nodemailer.createTransport({
  //   service: "Gmail",
  //   auth: {
  //     user: process.env.EMAIL_USERNAME,
  //     pass: process.env.EMAIL_PASSWORD,
  //   },
  // We need to activate the less secure app option in our gmail account to be able to use this service
  // });
  //
  //
  //
  //
  // Name of the service is we are going to use Mailtrap
  const transporter = nodemailer.createTransport({
    // We need to define host instead of service because Mailtrap is not once the default services that come configured with nodemailer
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    logger: true,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2 Define email options
  const mailOptions = {
    // here we specify where the email is coming from
    from: "Emre Küpçüoğlu <admin@emre.io>",
    // here we specify the recipient address
    to: options.email,
    subject: options.subject,
    // This si the text version of the email
    text: options.message,
    // this is the html version
    // html:
  };
  // 3. actually send the email
  // .sendMail() method return a promise
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
