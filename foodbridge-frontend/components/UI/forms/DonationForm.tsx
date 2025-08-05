// import { useCallback, useState } from "react";
// import { useForm } from "react-hook-form";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { zodResolver } from "@hookform/resolvers/zod";
// import AsyncSelect from "react-select/async";
// import makeAnimated from "react-select/animated";
// import { string, ZodSchema } from "zod";
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
// import { useDonationOptions } from "../../hooks/useDonationOptions";
// import { type DonationFormData } from "../../lib/validation";
// import { FIELD_NAMES, FIELD_TYPES } from "../../constants";

// const defaultDonationImages = [
//   "/images/assets/beverages-3105631_640.jpg",
//   "/images/assets/corn-984635_640.jpg",
//   "/images/assets/crayfish-472815_640.jpg",
//   "/images/assets/istockphoto-155373465-612x612.jpg",
//   "/images/assets/istockphoto-185024956-1024x1024.jpg",
//   "/images/assets/istockphoto-637856490-612x612.jpg",
//   "/images/assets/istockphoto-1194287257-612x612.jpg",
//   "/images/assets/meat-1769188_640.jpg",
//   "/images/assets/rice-3506194_640.jpg",
//   // "/images/download (1).jpeg",
// ];

// interface SelectOption {
//   value: string;
//   label: string;
// }

// interface Props {
//   schema: ZodSchema;
//   type: "DONATION" | "EDIT_DONATION";
//   defaultValues: DonationFormData;
//   onSubmit: (
//     data: DonationFormData
//   ) => Promise<{ success: boolean; error?: string }>;
//   isModal?: boolean;
//   onCancel?: () => void;
// }

// function DonationForm({
//   schema,
//   defaultValues,
//   onSubmit,
//   type,
//   isModal = false,
//   onCancel,
// }: Props) {
//   const navigate = useNavigate();
//   const form = useForm<DonationFormData>({
//     resolver: zodResolver(schema),
//     defaultValues,
//   });

//   const { foodTypes, loading } = useDonationOptions();
//   const animatedComponents = makeAnimated();
//   const [selectedDefaultImage, setSelectedDefaultImage] = useState<
//     string | null
//   >(null);

//   const filterFoodTypes = useCallback(
//     (inputValue: string): SelectOption[] => {
//       if (!foodTypes || foodTypes.length === 0) return [];

//       return foodTypes
//         .filter((type) => type.toLowerCase().includes(inputValue.toLowerCase()))
//         .map((type) => ({ value: type, label: type }));
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

//   const handleSubmit = async (data: DonationFormData) => {
//     // const formData = new FormData();
//     // formData.append("food_type", data.food_type);
//     // formData.append("quantity", String(data.quantity));
//     // formData.append("expiry_date", data.expiry_date.toISOString().split("T")[0]);
//     // formData.append("food_description", data.food_description);
//     // formData.append("image_url", data.image);

//     // const imageToSend = data.image.startsWith('/')
//     // ? `${window.location.origin}${data.image}`
//     // : data.image;
//     // formData.append("image_url",imageToSend);

//     //file uploads i.e image upload
//     // if (data.image instanceof File) {
//     //   formData.append("image", data.image);
//     //   // default image strings/urls
//     // } else if (typeof data.image === "string") {
//     //   formData.append("image_url", data.image);
//     // }

//     // if (typeof data.image === "string") {
//     //   formData.append("image_url", data.image);
//     // }
//     // console.log(formData);

//     try {
//       // const result = await onSubmit(data);
//       const result = await onSubmit({
//         ...data,
//         image: data.image ?? "",
//       });

//       console.log(result);
//       if (result.success) {
//         toast.success(
//           type === "EDIT_DONATION"
//             ? "Donation updated successfully!"
//             : "Donation created successfully!"
//         );
//         navigate("/home");
//       } else if (result.error) {
//         toast.error(result.error);
//         console.error(result.error);
//       }
//     } catch (error) {
//       toast.error("An unexpected error occurred");
//     }
//   };

//   const donationFormFields = [
//     "food_type",
//     "quantity",
//     "expiry_date",
//     "food_description",
//     "image",
//   ] as const;

//   return (
//     <div
//       className={
//         isModal
//           ? "w-full"
//           : "min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4"
//       }
//     >
//       <div
//         className={
//           isModal
//             ? "w-full"
//             : "w-full max-w-md bg-white rounded-lg shadow-md p-6"
//         }
//       >
//         {!isModal && (
//           <div className="mb-6">
//             <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
//               {type === "EDIT_DONATION" ? "Edit Donation" : "New Donation"}
//             </h1>
//           </div>
//         )}
//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(handleSubmit)}
//             className="space-y-4"
//           >
//             {donationFormFields.map((fieldName) => (
//               <FormField
//                 key={fieldName}
//                 control={form.control}
//                 name={fieldName}
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="block text-sm font-medium text-gray-700 mb-1">
//                       {FIELD_NAMES[fieldName]}
//                     </FormLabel>

//                     <FormControl>
//                       {fieldName === "food_type" ? (
//                         <AsyncSelect
//                           cacheOptions
//                           // defaultOptions
//                           defaultOptions={foodTypes.map((type) => ({
//                             label: type,
//                             value: type,
//                           }))}
//                           isLoading={loading}
//                           isClearable
//                           components={animatedComponents}
//                           loadOptions={loadOptions}
//                           value={
//                             field.value
//                               ? {
//                                   value: field.value as string,
//                                   label: field.value as string,
//                                 }
//                               : null
//                           }
//                           onChange={(selectedOption) => {
//                             field.onChange(selectedOption?.value ?? "");
//                           }}
//                           onBlur={field.onBlur}
//                           placeholder="Search food types..."
//                           className="text-sm"
//                         />
//                       ) : fieldName === "food_description" ? (
//                         <textarea
//                           {...field}
//                           value={field.value as string}
//                           rows={4}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                           placeholder={`Enter ${FIELD_NAMES[
//                             fieldName
//                           ].toLowerCase()}...`}
//                         />
//                       ) : fieldName === "image" ? (
//                         <div className="mt-2">
//                           <p className="text-sm text-gray-600 mb-1">
//                             Select a default image:
//                           </p>
//                           <div className="flex gap-2 flex-wrap">
//                             {defaultDonationImages.map((src, idx) => (
//                               <img
//                                 key={idx}
//                                 src={src}
//                                 alt={`Default ${src}`}
//                                 className={`w-20 h-20 rounded object-cover cursor-pointer border-2 ${
//                                   selectedDefaultImage === src
//                                     ? "border-blue-500"
//                                     : "border-transparent"
//                                 }`}
//                                 onClick={() => {
//                                   setSelectedDefaultImage(src);
//                                   field.onChange(src); // set the selected image URL
//                                 }}
//                               />
//                             ))}
//                           </div>
//                         </div>
//                       ) : (
//                         <Input
//                           {...field}
//                           type={FIELD_TYPES[fieldName]}
//                           // value={field.value as string | number}
//                           value={
//                             fieldName === "expiry_date" &&
//                             field.value instanceof Date
//                               ? field.value.toISOString().split("T")[0] // format as string "YYYY-MM-DD"
//                               : (field.value as string | number)
//                           }
//                           onChange={(e) => {
//                             field.onChange(e.target.value); // let z.coerce.date() do the conversion
//                           }}
//                           className="w-full"
//                         />
//                       )}
//                     </FormControl>

//                     <FormMessage className="text-red-500 text-xs mt-1" />
//                   </FormItem>
//                 )}
//               />
//             ))}

//             <div className="flex justify-end gap-3 pt-4">
//               <Button
//                 type="button"
//                 onClick={() => navigate(-1)}
//                 variant="outline"
//                 className="text-blue-400 border-blue-500 hover:bg-blue-50"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
//               >
//                 {type === "EDIT_DONATION" ? "Update" : "Submit"}
//               </Button>
//             </div>
//           </form>
//         </Form>
//       </div>
//     </div>
//   );
// }

// export default DonationForm;
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import { string, ZodSchema } from "zod";
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

const defaultDonationImages = [
  "/images/assets/beverages-3105631_640.jpg",
  "/images/assets/corn-984635_640.jpg",
  "/images/assets/crayfish-472815_640.jpg",
  "/images/assets/istockphoto-155373465-612x612.jpg",
  "/images/assets/istockphoto-185024956-1024x1024.jpg",
  "/images/assets/istockphoto-637856490-612x612.jpg",
  "/images/assets/istockphoto-1194287257-612x612.jpg",
  "/images/assets/meat-1769188_640.jpg",
  "/images/assets/rice-3506194_640.jpg",
];

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
  const [selectedDefaultImage, setSelectedDefaultImage] = useState<
    string | null
  >(null);

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
      const result = await onSubmit({ ...data, image: data.image ?? "" });

      if (result.success) {
        toast.success(
          type === "EDIT_DONATION"
            ? "Donation updated successfully!"
            : "Donation created successfully!"
        );
        navigate("/home");
      } else if (result.error) {
        toast.error(result.error);
        console.error(result.error);
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
    "image",
  ] as const;

  return isModal ? (
    <div className=" flex items-center justify-center px-4 py-6 sm:px-6 md:px-8">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-green-500 rounded-t-xl">
          <h2 className="text-white text-lg font-semibold">
            {type === "EDIT_DONATION" ? "Edit Donation" : "New Donation"}
          </h2>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
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
                            defaultOptions={foodTypes.map((type) => ({
                              label: type,
                              value: type,
                            }))}
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
                            onChange={(selectedOption) =>
                              field.onChange(selectedOption?.value ?? "")
                            }
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
                        ) : fieldName === "image" ? (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">
                              Select a default image:
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {defaultDonationImages.map((src, idx) => (
                                <img
                                  key={idx}
                                  src={src}
                                  alt={`Default ${src}`}
                                  className={`w-20 h-20 rounded object-cover cursor-pointer border-2 ${
                                    selectedDefaultImage === src
                                      ? "border-blue-500"
                                      : "border-transparent"
                                  }`}
                                  onClick={() => {
                                    setSelectedDefaultImage(src);
                                    field.onChange(src);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Input
                            {...field}
                            type={FIELD_TYPES[fieldName]}
                            value={
                              fieldName === "expiry_date" &&
                              field.value instanceof Date
                                ? field.value.toISOString().split("T")[0]
                                : (field.value as string | number)
                            }
                            onChange={(e) => field.onChange(e.target.value)}
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
                  onClick={onCancel}
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
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
            {type === "EDIT_DONATION" ? "Edit Donation" : "New Donation"}
          </h1>
        </div>
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
                          defaultOptions={foodTypes.map((type) => ({
                            label: type,
                            value: type,
                          }))}
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
                          onChange={(selectedOption) =>
                            field.onChange(selectedOption?.value ?? "")
                          }
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
                      ) : fieldName === "image" ? (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">
                            Select a default image:
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {defaultDonationImages.map((src, idx) => (
                              <img
                                key={idx}
                                src={src}
                                alt={`Default ${src}`}
                                className={`w-20 h-20 rounded object-cover cursor-pointer border-2 ${
                                  selectedDefaultImage === src
                                    ? "border-blue-500"
                                    : "border-transparent"
                                }`}
                                onClick={() => {
                                  setSelectedDefaultImage(src);
                                  field.onChange(src);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Input
                          {...field}
                          type={FIELD_TYPES[fieldName]}
                          value={
                            fieldName === "expiry_date" &&
                            field.value instanceof Date
                              ? field.value.toISOString().split("T")[0]
                              : (field.value as string | number)
                          }
                          onChange={(e) => field.onChange(e.target.value)}
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
