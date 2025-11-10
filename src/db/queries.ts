import { Database } from 'bun:sqlite';
import { type UUID } from 'crypto';

export const insertUser = async (db: Database, email: string, username: string, password: string) => {
    const passwordHash = await Bun.password.hash(password)
    const insertQuery = db.query('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)  RETURNING id');

    const result = insertQuery.get(email, username, passwordHash) as { id: UUID};
    return result.id;
}

export const getUserByUsername = (db: Database, username: string) => {
    const selectQuery = db.query('SELECT id,password_hash FROM users WHERE username = ?');
    const user = selectQuery.get(username) as { id: UUID; email: string; username: string; password_hash: string } | undefined;
    return user;
}


export const getUserById = (db: Database, id: UUID) => {
    const selectQuery = db.query('SELECT id, email, username FROM users WHERE id = ?');
    const user = selectQuery.get(id) as { id: UUID; email: string; username: string } | undefined;
    return user;
}

export const insertLoan = (db: Database, userId: UUID, loanNumber: string, amount: number, startDate: string, endDate: string,interestRate: number, EMI: number, outstandingBalance: number) => {
    const insertQuery = db.query('INSERT INTO loans (user_id, loanNumber, amount, startDate, endDate, interestRate, emi, outstandingBalance) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING loanNumber');
    const result = insertQuery.get(userId,loanNumber, amount, startDate, endDate,interestRate, EMI, outstandingBalance ) as { loan_number: string };  
    return result.loan_number;
}

export const getLoanbyUserId = (db: Database, userId: UUID) => {
    const selectQuery = db.query('SELECT * FROM loans WHERE user_id = ?');
    const loans = selectQuery.all(userId) as Array<{ id: number; loanNumber: string; user_id: UUID; amount: number; startDate: string; endDate: string; interestRate: number; overdueAmount: number; emi: number; outstandingBalance: number }>;
    return loans;
}

export const getLoanByLoanNumberAndUserId = (db: Database, loanNumber: string, userId: UUID) => {
    const selectQuery = db.query('SELECT * FROM loans WHERE loanNumber = ? AND user_id = ?');
    const loan = selectQuery.get(loanNumber,userId) as { id: number; loanNumber: string; user_id: UUID; amount: number; startDate: string; endDate: string; interestRate: number; overdueAmount: number; emi: number; outstandingBalance: number } | undefined;

    const payments = getPaymentsByLoanId(db, loan!.id!);
    const totalPaid = payments.reduce((sum, p) => sum + p.totalAmount, 0);

    const today = new Date();
    const start = new Date(loan!.startDate);
    const monthsElapsed = Math.max(
        0,
        (today.getFullYear() - start.getFullYear()) * 12 +
        (today.getMonth() - start.getMonth())
    );

    const expectedPaid = Math.min(monthsElapsed * loan!.emi, loan!.amount);

    // Overdue amount is expected minus total paid
    const overdueAmount = Math.max(0, expectedPaid - totalPaid);

    // Return loan with updated overdue
    return {
        ...loan,
        overdueAmount
    };

}

export const insertPayment = (db: Database, loanId: number, paymentNo: string, paymentDate: string, totalAmount: number, paymentMethod: string) => {
    const insertQuery = db.query('INSERT INTO payments (loan_id, paymentNo, paymentDate, totalAmount, paymentMethod) VALUES (?, ?, ?, ?, ?) RETURNING id');
    const result = insertQuery.get(loanId, paymentNo, paymentDate, totalAmount, paymentMethod) as { id: number };
    return result.id;
}

export const getPaymentsByLoanId = (db: Database, loanId: number) => {
    const selectQuery = db.query('SELECT * FROM payments WHERE loan_id = ?');
    const payments = selectQuery.all(loanId) as Array<{ id: number; loan_id: number; paymentNo: string; paymentDate: string; totalAmount: number; paymentMethod: string }>;
    return payments;
}