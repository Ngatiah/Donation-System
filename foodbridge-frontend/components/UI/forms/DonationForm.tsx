// import type {
//   // DefaultValues,
//   // FieldValues,
//   Path,
//   SubmitHandler,
//   UseFormReturn,
// } from "react-hook-form";
// import { useForm } from "react-hook-form";
// import React, { useCallback } from "react";
// // import { ZodType } from "zod";
// // import {DropdownMenu,DropdownMenuItem,DropdownMenuContent,DropdownMenuTrigger} from '../DropdownMenu'
// import { useNavigate } from "react-router-dom";
// import { useDonationOptions } from "../../hooks/useDonationOptions";
// // import { useTimeRangeOptions } from "../../hooks/useTimeRange";
// // import { useAvailabilityOptions } from "../../hooks/useAvailability";
// import { DonationFormData } from "../../lib/validation";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "../Form";
// import { Input } from "../Input";
// import { Button } from "../Button";
// import { FIELD_NAMES, FIELD_TYPES } from "../../constants";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { ZodSchema } from "zod";
// import AsyncSelect from "react-select/async";
// import makeAnimated from "react-select/animated";

// interface Props {
//   schema: ZodSchema;
//   // schema: ZodTypeAny;
//   // schema: ZodType<DonationFormData>;
//   type: "DONATION" | "EDIT_DONATION";
//   defaultValues: DonationFormData;
//   onSubmit: (
//     data: DonationFormData
//   ) => Promise<{ success: boolean; error?: string }>;
// }

// interface SelectOption {
//   value: string;
//   label: string;
// }

// function DonationForm({ schema, defaultValues, onSubmit, type }: Props) {
//   const navigate = useNavigate();
//   const form: UseFormReturn<DonationFormData> = useForm<DonationFormData>({
//     resolver: zodResolver(schema),
//     // defaultValues: defaultValues as DefaultValues<DonationFormData>,
//     defaultValues,
//   });

//   const { foodTypes, loading } = useDonationOptions();
//   const animatedComponents = makeAnimated();
//   // const filterFoodTypes = useCallback((inputValue: string) => {
//   //    if (!inputValue) {
//   //      return foodTypes.map(type => ({ value: type, label: type }));
//   //     }

//   // return foodTypes.filter(type => type.toLowerCase().includes(inputValue.toLowerCase()))
//   //                    .map(type => ({ value: type, label: type }));
//   //                }, [foodTypes]); //

//   // const loadOptions = useCallback((inputValue: string) =>
//   //                  new Promise<SelectOption[]>(resolve => {
//   //                      resolve(filterFoodTypes(inputValue));
//   //                  }),
//   //                [filterFoodTypes]);

//   const filterFoodTypes = useCallback(
//     (inputValue: string): SelectOption[] => {
//       if (!foodTypes || foodTypes.length === 0) {
//         return []; // Return empty array if no options loaded yet
//       }
//       const filtered = foodTypes.filter((type) =>
//         type.toLowerCase().includes(inputValue.toLowerCase())
//       );
//       return filtered.map((type) => ({ value: type, label: type }));
//     },
//     [foodTypes]
//   );

//   const loadOptions = useCallback(
//     (inputValue: string) =>
//       new Promise<SelectOption[]>((resolve) => {
//         resolve(filterFoodTypes(inputValue));
//       }),
//     [filterFoodTypes]
//   );

//   const handleSubmit: SubmitHandler<DonationFormData> = async (data) => {
//     console.log("FORM DATA", data);
//     const result = await onSubmit(data);
//     if (result.success) {
//       navigate("/home");
//     } else {
//       console.error(result.error);
//     }
//   };

//   const donationFormFields = [
//     "food_type",
//     "quantity",
//     "expiry_date",
//     "food_description",
//   ] as const;

//   const donationFieldTypes = donationFormFields.reduce((acc, field) => {
//     acc[field] = FIELD_TYPES[field];
//     return acc;
//   }, {} as Record<(typeof donationFormFields)[number], string>);

//   const donationFieldNames = donationFormFields.reduce((acc, field) => {
//     acc[field] = FIELD_NAMES[field];
//     return acc;
//   }, {} as Record<(typeof donationFormFields)[number], string>);

//   return (
//     <div className="flex flex-col gap-4">
//       <h1 className="text-2xl font-semibold text-white">DonationForm</h1>
//       <Form {...form}>
//         <form
//           onSubmit={form.handleSubmit(handleSubmit)}
//           className="w-full space-y-6"
//         >
//           {donationFormFields.map((fieldName) => (
//             <FormField
//               key={fieldName}
//               control={form.control}
//               name={fieldName as Path<DonationFormData>}
//               render={({ field }) => (
//                 <FormItem>
//                   {/* {fieldName !== "food_type" && fieldName !== "time_range" && ( */}
//                   {fieldName !== "food_type" && (
//                     <FormLabel className="capitalize">
//                       {
//                         donationFieldNames[
//                           fieldName as keyof typeof donationFieldNames
//                         ]
//                       }
//                     </FormLabel>
//                   )}
//                   <FormControl>
//                     {fieldName === "food_type" ? (
//                       <AsyncSelect
//                         cacheOptions
//                         defaultOptions
//                         isLoading={loading}
//                         isClearable
//                         components={animatedComponents}
//                         loadOptions={loadOptions}
//                         // value={field.value ? { value: field.value, label: field.value } : null}
//                         value={
//                           field.value
//                             ? {
//                                 value: field.value as string,
//                                 label: field.value as string,
//                               }
//                             : null
//                         }
//                         onChange={(selectedOption: SelectOption | null) => {
//                           field.onChange(
//                             selectedOption ? selectedOption.value : ""
//                           );
//                         }}
//                         onBlur={field.onBlur}
//                         placeholder="Type to search food types..."
//                         noOptionsMessage={() => "No matching food types"}
//                         loadingMessage={() => "Loading food types..."}
//                         className="react-select-container" // For overall container styling
//                         classNamePrefix="react-select" // For styling internal components
//                       />
//                     ) : fieldName === "food_description" ? (
//                       <textarea
//                         {...field}
//                         value={
//                           typeof field.value === "string" ? field.value : ""
//                         }
//                         rows={4}
//                         className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         placeholder="Enter a brief description of the food..."
//                       />
//                     ) : (
//                       <Input
//                         required
//                         // value={field.value ?? ""}
//                         value={
//                           typeof field.value === "object"
//                             ? ""
//                             : field.value ?? ""
//                         }
//                         name={field.name}
//                         type={donationFieldTypes[fieldName]}
//                         // {...field}
//                         className="form-input"
//                         onChange={field.onChange}
//                         // onBlur={field.onBlur}
//                         // ref={field.ref}
//                       />
//                     )}
//                   </FormControl>

//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           ))}

//           <Button type="submit" className="form-btn">
//             {/* Donate */}
//             {type === "EDIT_DONATION" ? "Update Donation" : "Donate"}
//           </Button>
//         </form>
//       </Form>
//     </div>
//   );
// }
// export default DonationForm;
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import { ZodSchema } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../Form";
import { Input } from "../Input";
import { Button } from "../Button";
import { useDonationOptions } from "../../hooks/useDonationOptions";
import { type DonationFormData } from "../../lib/validation";
import { FIELD_NAMES, FIELD_TYPES } from "../../constants";

interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  schema: ZodSchema;
  type: "DONATION" | "EDIT_DONATION";
  defaultValues: DonationFormData;
  onSubmit: (
    data: DonationFormData
  ) => Promise<{ success: boolean; error?: string }>;
  isModal?: boolean;
  onCancel?: () => void;
}

function DonationForm({
  schema,
  defaultValues,
  onSubmit,
  type,
  isModal = false,
  onCancel,
}: Props) {
  const navigate = useNavigate();
  const form = useForm<DonationFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { foodTypes, loading } = useDonationOptions();
  const animatedComponents = makeAnimated();

  const filterFoodTypes = useCallback(
    (inputValue: string): SelectOption[] => {
      if (!foodTypes || foodTypes.length === 0) return [];
      return foodTypes
        .filter((type) => type.toLowerCase().includes(inputValue.toLowerCase()))
        .map((type) => ({ value: type, label: type }));
    },
    [foodTypes]
  );

  const loadOptions = useCallback(
    (inputValue: string) =>
      new Promise<SelectOption[]>((resolve) => {
        resolve(filterFoodTypes(inputValue));
      }),
    [filterFoodTypes]
  );

  const handleSubmit = async (data: DonationFormData) => {
    try {
      const result = await onSubmit(data);
      if (result.success) {
        toast.success(
          type === "EDIT_DONATION"
            ? "Donation updated successfully!"
            : "Donation created successfully!"
        );
        navigate("/home");
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const donationFormFields = [
    "food_type",
    "quantity",
    "expiry_date",
    "food_description",
  ] as const;

  return (
    // <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
    //   <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
    //     <div className="mb-6">
    //       <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
    //         {type === "EDIT_DONATION" ? "Edit Donation" : "New Donation"}
    //       </h1>
    //     </div>
    <div
      className={
        isModal
          ? "w-full"
          : "min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4"
      }
    >
      <div
        className={
          isModal
            ? "w-full"
            : "w-full max-w-md bg-white rounded-lg shadow-md p-6"
        }
      >
        {!isModal && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
              {type === "EDIT_DONATION" ? "Edit Donation" : "New Donation"}
            </h1>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {donationFormFields.map((fieldName) => (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700 mb-1">
                      {FIELD_NAMES[fieldName]}
                    </FormLabel>

                    <FormControl>
                      {fieldName === "food_type" ? (
                        <AsyncSelect
                          cacheOptions
                          defaultOptions
                          isLoading={loading}
                          isClearable
                          components={animatedComponents}
                          loadOptions={loadOptions}
                          value={
                            field.value
                              ? {
                                  value: field.value as string,
                                  label: field.value as string,
                                }
                              : null
                          }
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption?.value ?? "");
                          }}
                          onBlur={field.onBlur}
                          placeholder="Search food types..."
                          className="text-sm"
                        />
                      ) : fieldName === "food_description" ? (
                        <textarea
                          {...field}
                          value={field.value as string}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter ${FIELD_NAMES[
                            fieldName
                          ].toLowerCase()}...`}
                        />
                      ) : (
                        <Input
                          {...field}
                          type={FIELD_TYPES[fieldName]}
                          value={field.value as string | number}
                          className="w-full"
                        />
                      )}
                    </FormControl>

                    <FormMessage className="text-red-500 text-xs mt-1" />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                variant="outline"
                className="text-blue-400 border-blue-500 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
              >
                {type === "EDIT_DONATION" ? "Update" : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default DonationForm;
