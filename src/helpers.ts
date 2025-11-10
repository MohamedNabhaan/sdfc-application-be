import { sign } from 'hono/jwt'
import { CookieOptions } from 'hono/utils/cookie'
import { getLoanbyUserId } from './db/queries';
import { Database } from 'bun:sqlite';
import { type UUID } from 'crypto';

export const genereateJwtToken = async (userId: string, ) => {
    const secret = process.env.JWT_TOKEN;
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: userId,
        iat: now,
        exp: now + 1 * 60 * 60
    }
    const token = await sign(payload,secret!)
    return token
}


export const cookieOpts = {
    httpOnly: true,
    secure: false,
    samesite: 'Lax', // or Strict
    path: '/',
    maxAge: 3600
} as CookieOptions;


export const calculateEMI = (principal: number, annualInterestRate: number, tenureMonths: number): number => {
    const monthlyRate = annualInterestRate / (12 * 100);
    const emi =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Number(emi.toFixed(2));
};


export const generateNextLoanNumber = (db: Database, userId: UUID): string => {
  const loans = getLoanbyUserId(db, userId);

  if (loans.length === 0) return 'LN001'; 

  const lastLoan = loans.sort((a, b) => b.id - a.id)[0];

  const lastNumber = parseInt(lastLoan.loanNumber.replace('LN', ''), 10);

  const newNumber = lastNumber + 1;

  return `LN${String(newNumber).padStart(3, '0')}`; // e.g., LN004
};