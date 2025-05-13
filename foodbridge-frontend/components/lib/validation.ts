import { boolean, z } from "zod";
import {parsePhoneNumberFromString} from 'libphonenumber-js'
export const signUpSchema = z
  .object({
    name: z.string().min(3, "Name is required"),
    email: z.string().email("Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["donor", "recipient"], {
      required_error: "Role is required",
    }),
    food_type: z.string().optional(),
    quantity: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          return parseInt(val, 10);
        }
        return val;
      },
      z.number().optional().refine((val) => val === undefined || val >= 0, {
        message: "Quantity must be a positive number",
      })
    ),    
        contact_phone: z
    .string()
    .min(9, "Phone number must be at least 9 characters long")
    .refine((val) => {
      const phone = parsePhoneNumberFromString(val,'KE');
      return phone?.isValid() ?? false;
    }, {
      message: "Enter a valid phone number",
    })
    .transform((val) => {
      const phone = parsePhoneNumberFromString(val,'KE');
      return phone ? phone.format("E.164") : val;
    }),
    })
  .superRefine((data, ctx) => {
    if (data.role === "recipient") {
      if (!data.food_type || data.food_type.length < 3) {
        ctx.addIssue({
          path: ["food_type"],
          message: "Food type is required for recipients",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.quantity === undefined || isNaN(data.quantity)) {
        ctx.addIssue({
          path: ["quantity"],
          message: "Quantity is required for recipients",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });



export const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8,"Invalid password"),
});


export const donationSchema = z.object({
  food_type: z.string().optional(),
  quantity: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          return parseInt(val, 10);
        }
        return val;
      },
      z.number().optional().refine((val) => val === undefined || val >= 0, {
        message: "Quantity must be a positive number",
      })
    ),    
    available : z.boolean(),
    expiry_date : z.date()


})

export const editProfileSchema = z.object({
  name: z.string().min(3, "Name is required"),
  role: z.enum(["donor", "recipient"], {
      required_error: "Role is required",
    }),
  food_type: z.string().optional(),
  quantity: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          return parseInt(val, 10);
        }
        return val;
      },
      z.number().optional().refine((val) => val === undefined || val >= 0, {
        message: "Quantity must be a positive number",
      })
    ),    
  contact_phone: z
    .string()
    .min(9, "Phone number must be at least 9 characters long")
    .refine((val) => {
      const phone = parsePhoneNumberFromString(val,'KE');
      return phone?.isValid() ?? false;
    }, {
      message: "Enter a valid phone number",
    })
    .transform((val) => {
      const phone = parsePhoneNumberFromString(val,'KE');
      return phone ? phone.format("E.164") : val;
    }),
  available : boolean()
}).superRefine((data, ctx) => {
  if (data.role === "recipient" && !data.food_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Food type is required for recipients",
      path: ["food_type"],
    });
  }
  if (data.role === "recipient" && (data.quantity === undefined || isNaN(data.quantity))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Quantity is required for recipients",
      path: ["quantity"],
    });
  }
});











// export const bookSchema = z.object({
//   title: z
//     .string()
//     .trim()
//     .min(2, { message: "Title must be at least 2 characters." })
//     .max(100, { message: "Title must be at most 100 characters." }),
//   author: z
//     .string()
//     .trim()
//     .min(2, { message: "Author must be at least 2 characters." })
//     .max(100, { message: "Author must be at most 100 characters." }),
//   genre: z
//     .string()
//     .trim()
//     .min(2, { message: "Category must be at least 2 characters." })
//     .max(50, { message: "Category must be at most 50 characters." }),
//   rating: z.coerce
//     .number()
//     .min(1, { message: "Rating must be at least 1." })
//     .max(5, { message: "Rating must be at most 5." }),
//   totalCopies: z.coerce
//     .number({
//       invalid_type_error: "Quantity must be a number.",
//     })
//     .int({ message: "Quantity must be an integer." })
//     .positive({ message: "Quantity must be at least 1." })
//     .lte(10000, { message: "Quantity cannot exceed 10,000." }),
//   description: z
//     .string()
//     .trim()
//     .min(10, { message: "Description must be at least 10 characters." })
//     .max(500, { message: "Description must be at most 1000 characters." }),
//   coverUrl: z.string().nonempty("Uploading a cover image is required"),
//   coverColor: z
//     .string()
//     .trim()
//     .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
//       message: "Cover color must be a valid hex color code.",
//     }),
//   videoUrl: z.string().nonempty("Uploading a video is required"),
//   summary: z
//     .string()
//     .trim()
//     .min(10, { message: "Summary must be at least 10 characters." }),
// });