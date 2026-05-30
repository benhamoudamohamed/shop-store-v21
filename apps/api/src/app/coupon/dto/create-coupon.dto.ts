import { z } from 'zod';

export const CreateCouponSchema = z.object({
    code: z.string()
    .min(6, "Coupon code must be at least 6 characters")
    .max(12, "Code is too long (keep it under 12 for easy typing)")
    .toUpperCase()
    .trim()
    .regex(/^[A-Z]+-[A-Z0-9]{4}$/, "Format must be THEME-XXXX (e.g., SUMMER-A1B2)"),

    discountPercentage: z.coerce.number()
    .min(1, "Discount must be at least 1%")
    .max(100, "Discount cannot exceed 100%"),

    userLimit: z.coerce.number()
    .int("Limit must be a whole number")
    .positive("Limit must be greater than 0"),

    startDate: z.coerce.date().optional(),
    expirationDate: z.iso.datetime()
    .refine((date) => new Date(date) > new Date(), {
        message: "Expiration date must be in the future",
    }),

    // We set expired to false by default in the entity, 
    // but we can allow an optional initial state here.
    isExpired: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
});
export type CreateCouponDto = z.infer<typeof CreateCouponSchema>;

const booleanPreprocess = (val: unknown) => {
  if (typeof val === 'string') {
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
    }
  return val
};

export const UpdateExpirationSchema = z.object({
  isExpired: z.preprocess(booleanPreprocess, z.boolean()).optional(),
  isActive: z.preprocess(booleanPreprocess, z.boolean()).optional(),
});
export type UpdateExpirationDto = z.infer<typeof UpdateExpirationSchema>;
