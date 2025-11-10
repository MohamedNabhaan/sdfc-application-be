import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';


export const loanSchema = z.object({
    amount: z.number().positive({message: "Amount must be a positive number"}),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid start date" }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid end date" }),
    interestRate: z.number().min(0, {message: "Interest rate cannot be negative"})
});

export const loanValidator = zValidator('json',loanSchema, (result,c) => {
    if (!result.success) {
        return c.json({ errors: result.error.issues.map(issue => issue.message) }, 400);
    }
});