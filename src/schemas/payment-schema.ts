import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';


export const paymentSchema = z.object({
    amount: z.number().positive({message: "Amount must be a positive number"}),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date" }),
    method: z.enum(['Cash', 'Card', 'Transfer'], "Payment method must be one of the allowed options"),
});

export const paymentValidator = zValidator('json',paymentSchema, (result,c) => {
    if (!result.success) {
        return c.json({ errors: result.error.issues.map(issue => issue.message) }, 400);
    }
});