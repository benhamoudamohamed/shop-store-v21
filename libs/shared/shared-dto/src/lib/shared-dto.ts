import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const CredentialsSchema = z.object({
  fullName: z.string("Full Name is required")
    .min(4, "Full Name is too short")
    .max(256, "Full Name cannot be longer than 256 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full Name can only contain letters and spaces"),
 
  email: z.string().regex(/^[a-zA-Z0-9._+-]+@gmail\.com$/, { message: "Must be a valid Gmail address" })
  .or(z.string().regex(/^[a-zA-Z0-9._+-]+@outlook\.com$/, { message: "Must be a valid Outlook address" }))
  .or(z.string().regex(/^[a-zA-Z0-9._+-]+@outlook\.fr$/, { message: "Must be a valid Outlook address" }))
  .refine((val) => {
      const [localPart] = val.split('@');
      return localPart.length >= 5; // Example: local part must be at least 5 chars
    }, {
      message: "The name before @gmail/@outlook is too short"
    }),

  // trim whitespace
  password: z.string("Password is required").trim() 
    .min(6, "Password must be at least 6 characters long")
    .max(256, "Password cannot be longer than 256 characters")
    .regex(/((?=.*\d)(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

  created: z.date().default(() => new Date())
})

// class is required for using DTO as a type 
export class CreateUserDto extends createZodDto(CredentialsSchema) {}


// To be 100% safe and ensure Zod ignores the email and password during an update,
//  define the UpdateUserSchema explicitly by picking the field before passing it to the DTO class.

// 1. Create the specific schema for updating (ONLY fullname)
const UpdateUserSchema = CredentialsSchema.pick({
  fullName: true,
});
// 2. Create the DTO class from that specific restricted schema
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}





// 1. Create the specific schema for updating (ONLY fullname)
const UpdateUserPasswordSchema = CredentialsSchema.pick({
  password: true,
  email: true,
});
// 2. Create the DTO class from that specific restricted schema
export class UpdateUserPasswordDto extends createZodDto(UpdateUserPasswordSchema) {}



// get totalTTC() as a computed property in the response DTO by defining a transformation in the Zod schema// 1. Keep this core transformer
export const SingleProductSchema = z.any().transform((entity) => {
  const price = Number(entity.unitPrice || 0);
  const rate = Number(entity.tvaRate || 0);
  const taxAmount = 1 + Number(entity.tvaRate || 0) / 100;
  const totalTTC = Number((Number(entity.unitPrice) * taxAmount).toFixed(2));
  const originalPriceTTC = entity.compareAtPrice ? Number((Number(entity.compareAtPrice) * taxAmount).toFixed(2)) : null;

  return {
    id: Number(entity.id),
    productCode: String(entity.productCode),
    name: String(entity.name),
    description: String(entity.description || ''),
    unitPrice: price,
    tvaRate: rate,
    stock: Number(entity.stock || 0),
    isFavorite: Boolean(entity.isFavorite),
    isAvailable: Boolean(entity.isAvailable),
    isNewArrival: Boolean(entity.isNewArrival),
    images: entity.images || [],
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    totalTTC: totalTTC,
    originalPriceTTC: originalPriceTTC,
  };
});

// 2. This remains your DTO class for paginated lists: GET /products/all
export const ProductResponseSchema = z.object({
  data: z.array(SingleProductSchema),
  count: z.number(),
});
export class ProductResponseDto extends createZodDto(ProductResponseSchema) {}

// 3. 🟢 ADD THIS: Your new DTO class for single product lookups: GET /products/:id
export class SingleProductResponseDto extends createZodDto(SingleProductSchema) {}