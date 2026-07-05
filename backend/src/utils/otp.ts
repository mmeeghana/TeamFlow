import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const OTP_DIGITS = 6;
const OTP_SALT_ROUNDS = 12;

export const OTP_EXPIRES_IN_MINUTES = 10;

export function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(OTP_DIGITS, '0');
}

export function getOtpExpirationDate() {
  return new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
}

export function hashOtp(otp: string) {
  return bcrypt.hash(otp, OTP_SALT_ROUNDS);
}

export function compareOtp(otp: string, otpHash: string) {
  return bcrypt.compare(otp, otpHash);
}
