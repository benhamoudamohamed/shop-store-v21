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