import { Hono } from 'hono'
import { getDb } from './db/db'
import { signupValidator } from './schemas/signup-schema'
import { getLoanByLoanNumber, getLoanbyUserId, getPaymentsByLoanId, getUserById, getUserByUsername, insertLoan, insertPayment, insertUser } from './db/queries';
import { calculateEMI, cookieOpts, generateNextLoanNumber, genereateJwtToken } from './helpers';
import { deleteCookie, setCookie } from 'hono/cookie';
import "dotenv/config";
import { loginValidator } from './schemas/login-schema';
import { csrf } from 'hono/csrf'
import { jwt } from 'hono/jwt'
import { loanValidator } from './schemas/loan-schema';
import { paymentValidator } from './schemas/payment-schema';
import { cors } from 'hono/cors';

const app = new Hono()

app
.use('*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
}))
.use('/api/*', async (c, next)=> {
    if (c.req.path === '/api/logout') return next(); // skip CSRF for logout
    return csrf()(c, next);
})
.use('/api/auth/*', jwt({ secret: process.env.JWT_TOKEN!, cookie: 'token' }))
.post('/api/signup',signupValidator, async (c) => {
  const db = getDb();
  const { email, username, password } = c.req.valid('json');

  try {
    const userId = await insertUser(db, email, username, password);
    const token = await genereateJwtToken(userId);

    setCookie(c,'token', token, cookieOpts );
    return c.json({ message: 'User created successfully', user: { id: userId, email} }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Email or username already exists' }, 409);
    }
    console.error('signup error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }

})
.post('/api/login',loginValidator, async (c) => {
  const { username, password } = c.req.valid('json');
  const db = getDb();

  try {
    const user = getUserByUsername(db, username);
    if (!user) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    const matchedPassword = await Bun.password.verify(password,user.password_hash);
    if (!matchedPassword) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    const token = await genereateJwtToken(user.id);
    setCookie(c,'token', token, cookieOpts );
    return c.json({ message: 'Login successful' }, 200);
  }
  catch (error) {
    console.error('login error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})
.post('/api/logout', async (c) => {
  console.log('here')
  deleteCookie(c,'token', cookieOpts);
  return c.json({ message: 'Logout successful' }, 200);
})
.get('/api/auth/profile', async (c) => {
  const db = getDb();
  const jwtPayload = c.get('jwtPayload')

  try {
    const user = getUserById(db, jwtPayload.sub);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ message: 'Profile fetched successfully', user }, 200);

  }
  catch (error) {
    console.error('profile error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})
.post('/api/auth/create-loan',loanValidator, async (c) => {
  const db = getDb();
  const { amount, startDate, endDate, interestRate } = c.req.valid('json');
  const tenureMonths =
      (new Date(endDate).getFullYear() - new Date(startDate).getFullYear()) * 12 +
      (new Date(endDate).getMonth() - new Date(startDate).getMonth());
  console.log(tenureMonths)
  const EMI = calculateEMI(amount, interestRate, tenureMonths);
  console.log(EMI)

  const generatedLoanNumber = generateNextLoanNumber(db, c.get('jwtPayload').sub);

  try {
    const loanNumber = insertLoan(db, c.get('jwtPayload').sub, generatedLoanNumber, amount, startDate, endDate, interestRate, EMI, amount);
    return c.json({ message: 'Loan created successfully', loanNumber }, 201);
  }
  catch (error) {
    console.error('create-loan error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }

})
.get('/api/auth/get-loan/:id', (c) => { 
  const db = getDb();
  const loanId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;

  try {
    const loan = getLoanByLoanNumber(db, loanId);
    if (loan!.user_id !== userId) {
      return c.json({ error: 'Unauthorized access to this loan' }, 403);
    }
    if (!loan) {
      return c.json({ error: 'Loan not found' }, 404);
    }
    return c.json({ message: 'Loan fetched successfully', loan }, 200);
  }
  catch (error) {
    console.error('get-loan error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
}
}
)
.get('/api/auth/get-loans', (c) => { 
  const db = getDb();
  const userId = c.get('jwtPayload').sub;

  try {
    const loans = getLoanbyUserId(db, userId);
    return c.json({ message: 'Loans fetched successfully', loans }, 200);
  }
  catch (error) {
    console.error('get-loans error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
}
}
)
.post('/api/auth/create-payment/:loanNumber', paymentValidator, async (c) => {
  const db = getDb();
  const { amount, date, method } = c.req.valid('json'); 
  const userId = c.get('jwtPayload').sub;

  const loanNumber = c.req.param('loanNumber');

  try {
    const loan = getLoanByLoanNumber(db, loanNumber);

    if (!loan) {
      return c.json({ error: 'Loan not found' }, 404);
    }
    if (loan.user_id !== userId) {
      return c.json({ error: 'Unauthorized access to this loan' }, 403);
    }
    const paymentNo = `PMT-${Date.now()}`;
    const paymentId = insertPayment(db, loan.id!, paymentNo, date, amount, method);

    return c.json({ message: 'Payment created successfully', paymentId }, 201);
  }
  catch (error) {
    console.error('create-payment error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})
.get('/api/auth/get-payments/:loanNumber', (c) => {
  const db = getDb();
  const userId = c.get('jwtPayload').sub;
  const loanNumber = c.req.param('loanNumber');

  try {
    const loan = getLoanByLoanNumber(db, loanNumber);

    if (!loan) {
      return c.json({ error: 'Loan not found' }, 404);
    }
    if (loan.user_id !== userId) {
      return c.json({ error: 'Unauthorized access to this loan' }, 403);
    }
    const payments = getPaymentsByLoanId(db, loan.id!); 

    if (payments.length === 0) {
      return c.json({ message: 'No payments found for this loan', payments: [] }, 200);
    }

    return c.json({ message: 'Payments fetched successfully', payments }, 200);
  }
  catch (error) {
    console.error('get-payments error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})

;
export default app
