import { z } from 'zod';

export const CreatePurchaseSchema = z.object({
    clientName: z.string("Name is required").trim() 
    .min(3, "Name is too short")
    .max(256, "Name cannot be longer than 256 characters")
    .regex(/^[a-zA-Z\s]+$/, "Client Name can only contain letters"),

    email: z.string().regex(/^[a-zA-Z0-9._+-]+@gmail\.com$/, { message: "Must be a valid Gmail address" })
    .or(z.string().regex(/^[a-zA-Z0-9._+-]+@outlook\.com$/, { message: "Must be a valid Outlook address" }))
    .or(z.string().regex(/^[a-zA-Z0-9._+-]+@outlook\.fr$/, { message: "Must be a valid Outlook address" }))
    .refine((val) => {
        const [localPart] = val.split('@');
        return localPart.length >= 5; // Example: local part must be at least 5 chars
        }, {
        message: "The name before @gmail/@outlook is too short"
    }),

    phone: z.string()
    .length(8, "Tunisian phone numbers must be exactly 8 digits")
    .regex(/^[2459]\d{7}$/, "Invalid Tunisian phone number format"),

    address: z.string().min(5, "Address is required"),
    coupon: z.string().optional(),
    
    productItems: z.array(
    z.object({
        productId: z.string(),
        quantity: z.number().min(1, "Quantity must be at least 1"),
    })
    ).min(1, "Purchase must have at least one item"),
});

export type CreatePurchaseDto = z.infer<typeof CreatePurchaseSchema>;