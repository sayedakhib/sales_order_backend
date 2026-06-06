import dotenv from 'dotenv';

dotenv.config();

// everything from .env pulled into one tidy object (with sensible fallbacks),
// so the rest of the code never has to touch process.env directly
const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sales_order',

  vatPercent: parseFloat(process.env.VAT_PERCENT || '5'),
  currency: process.env.CURRENCY || 'OMR',

  company: {
    name: process.env.COMPANY_NAME || 'Sayed Kaif Medical Distribution',
    address: process.env.COMPANY_ADDRESS || 'Muscat, Oman',
    phone: process.env.COMPANY_PHONE || '',
    email: process.env.COMPANY_EMAIL || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Sales Orders <no-reply@example.com>',
    recipients: (process.env.MAIL_RECIPIENTS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
};

export default env;
