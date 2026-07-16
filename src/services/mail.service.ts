import { Resend } from "resend";
import { getMailTemplate } from "../mail.template.js";
import { getEnv } from "../utils/getEnv.js";
import { FeedbackSubmission } from "../entities/FeedbackSubmission.js";

export class MailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(getEnv("RESEND_API_KEY"));
  }

  async sendVerificationCode(email: string, code: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.getMailFrom(),
        to: [email],
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

  async sendPasswordResetCode(email: string, code: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.getMailFrom(),
        to: [email],
        subject: "Sifre Sifirlama Kodun: " + code,
        html: getMailTemplate(code),
      });

      if (error) {
        console.error("Sifre sifirlama maili gonderme hatasi:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Beklenmedik sifre sifirlama mail hatasi:", err);
      return null;
    }
  }

  async sendFeedbackNotification(feedback: FeedbackSubmission) {
    const to =
      process.env.FEEDBACK_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;

    if (!to) {
      return null;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.getMailFrom(),
        to: [to],
        subject: `Yeni ${feedback.type} mesaji: ${feedback.subject}`,
        html: this.getFeedbackNotificationTemplate(feedback),
      });

      if (error) {
        console.error("Geri bildirim maili gonderme hatasi:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Beklenmedik geri bildirim mail hatasi:", err);
      return null;
    }
  }

  private getFeedbackNotificationTemplate(feedback: FeedbackSubmission) {
    const metadata = feedback.metadata
      ? `<pre>${this.escapeHtml(JSON.stringify(feedback.metadata, null, 2))}</pre>`
      : "<p>Metadata yok.</p>";

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Yeni geri bildirim</h2>
        <p><strong>Tip:</strong> ${this.escapeHtml(feedback.type)}</p>
        <p><strong>Baslik:</strong> ${this.escapeHtml(feedback.subject)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(feedback.email || "-")}</p>
        <p><strong>User ID:</strong> ${this.escapeHtml(feedback.userId || "-")}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${this.escapeHtml(feedback.message).replace(/\n/g, "<br />")}</p>
        <p><strong>Metadata:</strong></p>
        ${metadata}
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private getMailFrom() {
    return process.env.MAIL_FROM || "Auro Novel <onboarding@resend.dev>";
  }
}
