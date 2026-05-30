import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const CredentialsSchema = z.object({
    // trim whitespace
    name: z.string("Name is required").trim() 
    .min(4, "Name is too short")
    .max(256, "Name cannot be longer than 256 characters")
    .regex(/^[a-zA-Z\s]+$/, "Category Name can only contain letters"),

    description: z.string("Description is required").trim() 
    .min(4, "Description is too short")
    .max(256, "Description cannot be longer than 256 characters")
    .regex(/^[a-zA-Z\s]+$/, "Description Name can only contain letters"),
})

// class is required for using DTO as a type 
export class CreateCategoryDto extends createZodDto(CredentialsSchema) {}
