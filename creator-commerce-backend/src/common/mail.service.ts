import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const host = this.config.get<string>('SMTP_HOST');
    this.from = this.config.get<string>('SMTP_FROM') ?? 'no-reply@creator-commerce.local';
    const user = this.config.get<string>('SMTP_USER');

    // SMTP is optional - without it we log instead of sending, so the app
    // works out of the box in dev/test without any mail provider set up.
    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(this.config.get('SMTP_PORT') ?? 587),
          secure: this.config.get('SMTP_SECURE') === 'true',
          auth: user ? { user, pass: this.config.get<string>('SMTP_PASS') } : undefined,
        })
      : null;
  }

  // A notification email is a side effect of the action that triggered it,
  // never a reason to fail that action - errors are logged, not thrown.
  async notifyUser(userId: string, subject: string, html: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (!user) return;
      await this.send(user.email, subject, html);
    } catch (err) {
      this.logger.warn(`Failed to notify user ${userId}: ${(err as Error).message}`);
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.debug(`[mail skipped, SMTP not configured] to=${to} subject="${subject}"`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.warn(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }
}
