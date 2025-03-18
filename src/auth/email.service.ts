import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';

@Injectable()
export class EmailService {
  private readonly client: postmark.ServerClient;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.getOrThrow<string>('POSTMARK_TOKEN');
    this.client = new postmark.ServerClient(token);
  }

  async sendRegister(code: string, email: string): Promise<void> {
    try {
      const response = await this.client.sendEmail({
        From: this.configService.get<string>('EMAIL_FROM') || 'denast@knu.ua',
        To: email,
        Subject: 'Todo App sign up',
        TextBody: `To confirm your signup, input this code: ${code}`,
        MessageStream: 'outbound',
      });
      console.log('Code:', code);
      console.log('Email sent successfully:', response);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}
