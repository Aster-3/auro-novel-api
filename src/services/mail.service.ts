import { Resend } from "resend";
import { getMailTemplate } from "../mail.template.js";

export class MailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend("re_WowKReWr_BcWwKAGcDDdb3xK9qF9sPLXM");
  }

  async sendVerificationCode(email: string, code: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: "Auro Novel <onboarding@resend.dev>",
        to: ["emircanemre09@gmail.com"],
        subject: "Doğrulama Kodun: " + code,
        html: getMailTemplate(code),
      });

      if (error) {
        console.error("Mail gönderme hatası:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Beklenmedik mail hatası:", err);
      return null;
    }
  }
}
