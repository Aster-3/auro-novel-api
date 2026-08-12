import { Plunk } from "@plunk/node/dist/lib/Plunk.js";
import { getMailTemplate } from "../mail.template.js";
import { getEnv } from "../utils/getEnv.js";

export class MailService {
  private plunk: Plunk;

  constructor() {
    this.plunk = new Plunk(getEnv("PLUNK_API_KEY"), {
      baseUrl: "https://next-api.useplunk.com/v1/",
    });
  }

  async sendVerificationCode(email: string, code: string) {
    try {
      const result = await this.plunk.emails.send({
        ...this.getSender(),
        to: email,
        subject: "Dogrulama Kodun: " + code,
        body: getMailTemplate(code),
        type: "html",
      });

      return result;
    } catch (err) {
      console.error("Beklenmedik mail hatasi:", err);
      return null;
    }
  }

  async sendPasswordResetCode(email: string, code: string) {
    try {
      const result = await this.plunk.emails.send({
        ...this.getSender(),
        to: email,
        subject: "Sifre Sifirlama Kodun: " + code,
        body: getMailTemplate(code),
        type: "html",
      });

      return result;
    } catch (err) {
      console.error("Beklenmedik sifre sifirlama mail hatasi:", err);
      return null;
    }
  }

  private getSender() {
    const mailFrom = process.env.MAIL_FROM || "Auro Novel <noreply@auronovel.com>";
    const match = mailFrom.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);

    if (!match) {
      return { from: mailFrom };
    }

    return { name: match[1], from: match[2] };
  }
}
