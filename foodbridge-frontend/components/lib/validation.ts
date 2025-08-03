// import { boolean, z } from "zod";
import { z } from "zod";
import {parsePhoneNumberFromString} from 'libphonenumber-js'

export const signUpSchema = z
  .object({
    name: z.string().min(3, "Name is required"),
    email: z.string().email("Email is required"),
    city: z.string().min(1,"City is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["donor", "recipient"], {
      required_error: "Role is required",
    }),
    food_type: z.array(z.string()).optional(),
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
    .regex(/^7\d{8}$/, "Phone number must start with 7 and be 9 digits long")
    .refine((val) => {
      const phone = parsePhoneNumberFromString(val,'KE');
      return phone?.isValid() ?? false;
    }, {
      message: "Enter a valid Kenyan phone number",
    })
    .transform((val) => {
      const phone = parsePhoneNumberFromString(val,'KE');
      return phone ? phone.format("E.164") : val;
    }),
    })
  .superRefine((data, ctx) => {
    if (data.role === "recipient") {
      // atleast one must be chosen || undefined  || []
      if (!data.food_type || data.food_type.length === 0) {
        ctx.addIssue({
          path: ["food_type"],
          message: "Please choose at least ONE food type for recipients.",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.quantity === undefined || isNaN(data.quantity) || data.quantity <= 0) {
        ctx.addIssue({
          path: ["quantity"],
          message: "Quantity required and must be greater than zero for recipients",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });


export const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8,"Invalid password"),
});

// / time_range: z.object({
  //   from: z.string(),
  //   until: z.string(),
  //   label: z.string()
  //   // .min(1, "Please select a time range"),

  // }),

  // food_type: z.array(z.string()).default([]),

export const donationSchema = z.object({
  food_type: z.string().default(''),
  food_description: z.string().default(""),
  quantity: z.preprocess(
  (val) => (typeof val === "string" ? parseInt(val, 10) : val),
  z.number().min(0, "Quantity must be a positive number")
),
  expiry_date: z.coerce.date(),
  image: z.string().min(1, { message: "Please select a valid image" }),
  // image: z.union([
  //   z.instanceof(File),
  //   z.string().url({ message: "Please select a valid image" }),
  // ]),
  // image: z.string().url({ message: "Please select a valid image" }),

});

export type DonationFormData = z.infer<typeof donationSchema>;


// export const recipientNeedsSchema = signUpSchema.pick({
//   food_type : true,
//   quantity: true,
// });

// export type RecipientNeedsData = z.infer<typeof recipientNeedsSchema>;


 // string URL or file uploads
  // image: z.union([z.instanceof(File), z.string()]).optional(),
  // default image url/string
  // image: z
  // .string()
  // .url({ message: "Invalid image URL" })
  // .min(1, { message: "Please select an image" }),
  // image: z.string().url({ message: "Please select a valid image" }),
  // image: z
  //   .string()
  //   .refine(
  //     (val) =>
  //       /^https?:\/\/.+/.test(val) || val.startsWith("/media/"),
  //     { message: "Please select a valid image" }
  //   ),
  // image: z.string().nonempty({ message: "Please select a valid image" }),
  //  image: z.union([
  //   z.instanceof(File),
  //   z.string().url({ message: "Please select a valid image" }),
  // ]),

export const editProfileSchema = z.object({
  name: z.string().min(3, "Name is required"),
  role: z.enum(["donor", "recipient"]).optional(),
  food_type: z.array(z.string()).optional(),
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
  // quantity : z.preprocess(
  // (val) => val === undefined ? 0 : typeof val === "string" ? parseInt(val, 10) : val,
  // z.number().min(0)
  // ),
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
  // available : boolean()
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
