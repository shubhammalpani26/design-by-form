import { z } from 'zod';

// Designer signup validation
export const designerSignupSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  portfolio: z.string()
    .trim()
    .url('Invalid URL format')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  background: z.string()
    .trim()
    .min(1, 'Design background is required')
    .max(2000, 'Description must be less than 2000 characters'),
  interests: z.string()
    .trim()
    .min(1, 'Furniture interests are required')
    .max(1000, 'Description must be less than 1000 characters'),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  // Bank details (optional during signup, can be added later)
  bankCountry: z.enum(['India', 'International']).optional(),
  bankAccountHolderName: z.string().trim().max(200).optional(),
  bankAccountNumber: z.string().trim().max(50).optional(),
  bankIfscCode: z.string().trim().max(20).optional(),
  bankSwiftCode: z.string().trim().max(20).optional(),
  bankIban: z.string().trim().max(50).optional(),
});

// Design submission validation
export const designSubmissionSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Design name is required')
    .max(200, 'Design name must be less than 200 characters'),
  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  category: z.string()
    .trim()
    .min(1, 'Category is required'),
  basePrice: z.number()
    .min(1000, 'Base price must be at least ₹1,000')
    .max(10000000, 'Base price must be less than ₹1 crore'),
  designerPrice: z.number()
    .min(1000, 'Your price must be at least ₹1,000')
    .max(10000000, 'Your price must be less than ₹1 crore'),
  imageUrl: z.string()
    .trim()
    .url('Invalid image URL'),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.designerPrice >= data.basePrice, {
  message: 'Your selling price cannot be less than the base price',
  path: ['designerPrice'],
});

// Admin rejection reason validation
export const rejectionReasonSchema = z.string()
  .trim()
  .min(10, 'Rejection reason must be at least 10 characters')
  .max(1000, 'Rejection reason must be less than 1000 characters');

// Cart customizations validation
export const cartCustomizationsSchema = z.object({
  size: z.string().max(50).optional(),
  finish: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
}).passthrough(); // Allow additional properties but validate known ones

// Edge function validations
export const generateDesignSchema = z.object({
  prompt: z.string()
    .trim()
    .min(10, 'Prompt must be at least 10 characters')
    .max(2000, 'Prompt must be less than 2000 characters'),
  variationNumber: z.number()
    .int()
    .min(1)
    .max(10)
    .optional(),
});

export const checkPlagiarismSchema = z.object({
  imageUrl: z.string()
    .trim()
    .url('Invalid image URL')
    .max(2000, 'URL must be less than 2000 characters'),
  productId: z.string()
    .uuid('Invalid product ID')
    .optional(),
});
