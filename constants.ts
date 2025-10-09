import type { HSKLevel } from './types';

export const HSK_LEVELS: HSKLevel[] = [1, 2, 3, 4, 5, 6];
export const WORDS_PER_LESSON = 15;
export const WEIXIN_QR_CODE_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=https://weixin://dl/chat?/HSK1-6';
export const WHATSAPP_QR_CODE_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=https://wa.me/8562096473810';
