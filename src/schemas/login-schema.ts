import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';


export const loginSchema = z.object({
    username: z.string().min(3).max(30),
    password: z.string().min(8,{message: "Password must be atleast 8 characters long"})
});


export const loginValidator = zValidator('json',loginSchema, (result,c) => {
    if (!result.success) {
        return c.json({ errors: result.error.issues.map(issue => issue.message) }, 400);
    }
});