const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Emre Küpçüoğlu <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // code for sendGrid
      return nodemailer.createTransport({
        host: process.env.SENDGRID_HOST,
        port: process.env.SENDGRID_PORT,
        logger: true,
        secure: false,
        auth: {
          user: process.env.SEND_GRID_USERNAME,
          pass: process.env.SEND_GRID_API_KEY,
        },
      });
    }

    return nodemailer.createTransport({
      // We need to define host instead of service because Mailtrap is not one of the default services that come configured with nodemailer
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      logger: true,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1. Render the HTML based on a pug template
    // Up until this point when we are using pug we used it with res.render
    // res.render creates an HTML based on the pug template and sends it to the client
    // But in this case we do not want to send the HTML to the client.
    // ALl we want to do is to basically create the HTML out of the template so
    // that we can then send taht HTML as the email.
    // For this we need to require the pug package
    // Just like with res.render we can also pass in data to into renderFile
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    // 2. Define the email options
    const mailOptions = {
      // here we specify where the email is coming from
      from: this.from,
      // here we specify the recipient address
      to: this.to,
      subject,
      // this is the html version
      html,
      // This is the text version of the email
      // * It is really important to include a text version of the email because
      // Iıt is better for email delivery rates and also for spam folders.
      // And also some people just prefer plain text emails.
      // So we need aa way of converting all the HTML into simple text
      // So stripping out all the HTML and leaving only content
      // Fot this we are going to use the html-to-text package
      text: htmlToText.convert(html),
    };

    // 3. Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcomeEmail", "Welcome to the Natours family");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordResetEmail",
      "Your password reset token (valid for 10 mins)"
    );
  }
};

// ! Code below is old code it is here for learning purposes
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
  const transporter = nodemailer.createTransport({
    // We need to define host instead of service because Mailtrap is not one of the default services that come configured with nodemailer
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
    // This is the text version of the email
    text: options.message,
    // this is the html version
    // html:
  };
  // 3. actually send the email
  // .sendMail() method return a promise
  await transporter.sendMail(mailOptions);
};

// module.exports = sendEmail;
