const nodeMailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email
    this.firstName = user.name.split(' ')[0]
    this.url = url
    this.from = `Aaron Kenny <${process.env.EMAIL_FROM}>`
  }
  newTransport() {
    return nodeMailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  }
  async send(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    )
    const mailOptions = {
      from: this.email,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    }
    await this.newTransport().sendMail(mailOptions)
  }
  async sendWelcome() {
    await this.send('welcome', 'Wlcome to the Natours Family')
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset taken (valid for only 10 minutes)'
    )
  }
}
