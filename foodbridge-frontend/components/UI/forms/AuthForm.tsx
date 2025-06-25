// import { useCallback } from "react";
// import type {
//   DefaultValues,
//   FieldValues,
//   Path,
//   SubmitHandler,
//   UseFormReturn,
// } from "react-hook-form";
// import { useForm } from "react-hook-form";
// import { ZodType } from "zod";
// import { Link } from "react-router-dom";
// import { useToast } from "../../hooks/use-toast";
// import AsyncSelect from "react-select/async";
// import { useNavigate } from "react-router-dom";
// import { PhoneInput } from "../PhoneInput";
// import { useState } from "react";
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
// import { useDonationOptions } from "../../hooks/useDonationOptions";
// import { useCity } from "../../hooks/useCity";
// import makeAnimated from "react-select/animated";
// import Swal from "sweetalert2";
// import Logo from "../../miscellaneous/Logo";

// interface SelectOption {
//   value: string;
//   label: string;
// }

// interface Props<T extends FieldValues> {
//   schema: ZodType<T>;
//   defaultValues: T;
//   onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
//   type: "SIGN_IN" | "SIGN_UP";
// }

// type Role = "donor" | "recipient";

// function AuthForm<T extends FieldValues>({
//   schema,
//   defaultValues,
//   onSubmit,
//   type,
// }: Props<T>) {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const isSignIn = type === "SIGN_IN";
//   const [apiError, setApiError] = useState<string | null>(null);
//   const form: UseFormReturn<T> = useForm<T>({
//     resolver: zodResolver(schema),
//     defaultValues: defaultValues as DefaultValues<T>,
//   });
//   const role = form.watch("role" as Path<T>) as Role;
//   const { foodTypes, loading } = useDonationOptions();
//   const { cities: allCities, loadingCities } = useCity();
//   const animatedComponents = makeAnimated();
//   const filterFoodTypes = useCallback(
//     (inputValue: string) => {
//       if (!inputValue) {
//         return foodTypes.map((type) => ({ value: type, label: type }));
//       }
//       // Filter based on input value (case-insensitive)
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

//   //   const cityOptions = allCities.map(city => ({ value: city, label: city }));
//   //   const loadCityOptions = (inputValue: string) => {
//   //   return new Promise<SelectOption[]>(resolve => {
//   //     // Filter cities based on inputValue (optional)
//   //     const filtered = allCities
//   //       .filter(city => city.toLowerCase().includes(inputValue.toLowerCase()))
//   //       .map(city => ({ value: city, label: city }));
//   //     resolve(filtered);
//   //   });
//   // };

//   // const filterCityTypes = useCallback((inputValue: string): SelectOption[] => {
//   //     if (!allCities || allCities.length === 0) {
//   //       return []; // Return empty array if no options loaded yet
//   //     }
//   // const filtered = allCities.filter(type =>
//   //       type.toLowerCase().includes(inputValue.toLowerCase())
//   //     );
//   //     return filtered.map(type => ({ value: type, label: type }));
//   //   }, [allCities]);

//   //   const loadCityOptions = useCallback((inputValue: string) =>
//   //     new Promise<SelectOption[]>(resolve => {
//   //       resolve(filterCityTypes(inputValue));
//   //     }),
//   //     [filterCityTypes]
//   //   );

//   const filterCityTypes = useCallback(
//     (inputValue: string) => {
//       if (!inputValue) {
//         return allCities.map((type) => ({ value: type, label: type }));
//       }
//       // Filter based on input value (case-insensitive)
//       return allCities
//         .filter((type) => type.toLowerCase().includes(inputValue.toLowerCase()))
//         .map((type) => ({ value: type, label: type }));
//     },
//     [allCities]
//   );

//   const loadCityOptions = useCallback(
//     (inputValue: string) =>
//       new Promise<SelectOption[]>((resolve) => {
//         resolve(filterCityTypes(inputValue));
//       }),
//     [filterCityTypes]
//   );

//   const handleSubmit: SubmitHandler<T> = async (data) => {
//     console.log("FORM DATA", data);
//     setApiError(null);

//     const result = await onSubmit(data);

//     // if (result.success) {
//     //   toast({
//     //     title: "Success",
//     //     description: isSignIn
//     //       ? "You have successfully signed in."
//     //       : "You have successfully signed up.",
//     //   });
//     //   navigate("/home");
//     // } else {
//     //   toast({
//     //     title: `Error ${isSignIn ? "signing in" : "signing up"}`,
//     //     description: result.error,
//     //     variant: "destructive",
//     //   });
//     if (result.success) {
//       Swal.fire({
//         title: "Success",
//         text: isSignIn
//           ? "You have successfully signed in."
//           : "You have successfully signed up.",
//         icon: "success",
//         showConfirmButton: false, // 🔁 Hide OK button
//         timer: 1000,
//         timerProgressBar: true,
//         // confirmButtonColor: "#3085d6",
//       });
//       setTimeout(() => {
//         navigate("/home");
//       }, 3000);
//     } else {
//       Swal.fire({
//         title: `Error ${isSignIn ? "signing in" : "signing up"}`,
//         text: result.error || "Something went wrong.",
//         icon: "error",
//         showConfirmButton: false,
//         timer: 2000,
//         timerProgressBar: true,
//         // confirmButtonColor: "#d33",
//       });
//     }
//     setApiError(
//       result.error ||
//         `An unexpected error occurred during ${type.toLowerCase()}.`
//     );
//     console.error(`${type} failed:`, result.error);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <Logo />
//           <h1 className="text-3xl font-bold text-teal-800">
//             {isSignIn ? "Welcome Back" : "Create Your Account"}
//           </h1>
//           <p className="mt-2 text-gray-600">
//             {isSignIn
//               ? "Sign in to continue making a difference"
//               : "Join our community of food donors and recipients"}
//           </p>
//         </div>

//         <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-100">
//           <Form {...form}>
//             <form
//               onSubmit={form.handleSubmit(handleSubmit)}
//               className="space-y-4"
//             >
//               {Object.keys(defaultValues)
//                 .filter((field) => field !== "role")
//                 .map((field) => {
//                   if (
//                     (field === "food_type" || field === "quantity") &&
//                     role !== "recipient"
//                   ) {
//                     return null;
//                   }
//                   return (
//                     <FormField
//                       key={field}
//                       control={form.control}
//                       name={field as Path<T>}
//                       render={({ field }) => {
//                         return (
//                           <FormItem className="grid grid-cols-4 items-center gap-4">
//                             {field.name !== "food_type" &&
//                               field.name !== "city" && (
//                                 <FormLabel className="text-right text-gray-700">
//                                   {
//                                     FIELD_NAMES[
//                                       field.name as keyof typeof FIELD_NAMES
//                                     ]
//                                   }
//                                 </FormLabel>
//                               )}
//                             <div
//                               className={
//                                 field.name === "food_type" ||
//                                 field.name === "city"
//                                   ? "col-span-4"
//                                   : "col-span-3"
//                               }
//                             >
//                               <FormControl>
//                                 {field.name === "contact_phone" ? (
//                                   <PhoneInput
//                                     {...field}
//                                     onChange={(e) => {
//                                       const val = e.target.value.replace(
//                                         /^0/,
//                                         ""
//                                       );
//                                       field.onChange(val);
//                                     }}
//                                     className="w-full"
//                                   />
//                                 ) : field.name === "food_type" ? (
//                                   <AsyncSelect
//                                     components={animatedComponents}
//                                     isClearable
//                                     isMulti
//                                     cacheOptions
//                                     defaultOptions
//                                     isLoading={loading}
//                                     loadOptions={loadOptions}
//                                     value={(field.value || []).map(
//                                       (val: string) => ({
//                                         value: val,
//                                         label: val,
//                                       })
//                                     )}
//                                     onChange={(selectedOptions) => {
//                                       field.onChange(
//                                         selectedOptions.map(
//                                           (option) => option.value
//                                         )
//                                       );
//                                     }}
//                                     onBlur={field.onBlur}
//                                     placeholder="Type to search food types..."
//                                     noOptionsMessage={() =>
//                                       "No matching food types"
//                                     }
//                                     loadingMessage={() =>
//                                       "Loading food types..."
//                                     }
//                                     className="react-select-container"
//                                     classNamePrefix="react-select"
//                                     styles={{
//                                       control: (base) => ({
//                                         ...base,
//                                         minHeight: "42px",
//                                         borderColor: "#e2e8f0",
//                                         "&:hover": {
//                                           borderColor: "#0d9488",
//                                         },
//                                       }),
//                                     }}
//                                   />
//                                 ) : field.name === "city" ? (
//                                   <AsyncSelect
//                                     components={animatedComponents}
//                                     isClearable
//                                     cacheOptions
//                                     defaultOptions
//                                     isLoading={loadingCities}
//                                     loadOptions={loadCityOptions}
//                                     value={
//                                       field.value
//                                         ? {
//                                             value: field.value as string,
//                                             label: field.value as string,
//                                           }
//                                         : null
//                                     }
//                                     onChange={(
//                                       selectedOption: SelectOption | null
//                                     ) => {
//                                       field.onChange(
//                                         selectedOption
//                                           ? selectedOption.value
//                                           : ""
//                                       );
//                                     }}
//                                     onBlur={field.onBlur}
//                                     placeholder="Type to search for city..."
//                                     noOptionsMessage={() =>
//                                       "No matching cities"
//                                     }
//                                     loadingMessage={() => "Loading cities..."}
//                                     className="react-select-container"
//                                     classNamePrefix="react-select"
//                                     styles={{
//                                       control: (base) => ({
//                                         ...base,
//                                         minHeight: "42px",
//                                         borderColor: "#e2e8f0",
//                                         "&:hover": {
//                                           borderColor: "#0d9488",
//                                         },
//                                       }),
//                                     }}
//                                   />
//                                 ) : (
//                                   <Input
//                                     required
//                                     type={
//                                       FIELD_TYPES[
//                                         field.name as keyof typeof FIELD_TYPES
//                                       ]
//                                     }
//                                     {...field}
//                                     className="w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500"
//                                   />
//                                 )}
//                               </FormControl>
//                               <FormMessage className="col-span-4 text-xs text-rose-600 mt-1" />
//                             </div>
//                           </FormItem>
//                         );
//                       }}
//                     />
//                   );
//                 })}

//               {!isSignIn && (
//                 <div className="pt-4 pb-2">
//                   <FormField
//                     control={form.control}
//                     name={"role" as Path<T>}
//                     render={({ field }) => (
//                       <FormItem>
//                         <div className="flex flex-col space-y-2">
//                           <FormLabel className="text-center text-gray-700">
//                             I want to join as a:
//                           </FormLabel>
//                           <div className="flex justify-center gap-6">
//                             <label className="inline-flex items-center">
//                               <input
//                                 type="radio"
//                                 value="donor"
//                                 checked={field.value === "donor"}
//                                 onChange={field.onChange}
//                                 className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
//                               />
//                               <span className="ml-2 text-gray-700">Donor</span>
//                             </label>
//                             <label className="inline-flex items-center">
//                               <input
//                                 type="radio"
//                                 value="recipient"
//                                 checked={field.value === "recipient"}
//                                 onChange={field.onChange}
//                                 className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
//                               />
//                               <span className="ml-2 text-gray-700">
//                                 Recipient
//                               </span>
//                             </label>
//                           </div>
//                         </div>
//                         <FormMessage className="text-center text-xs text-rose-600 mt-1" />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               )}

//               {apiError && (
//                 <div className="text-center py-2">
//                   <div className="text-sm text-rose-600 font-medium px-4 py-2 bg-rose-50 rounded-lg">
//                     {apiError}
//                   </div>
//                 </div>
//               )}

//               <div className="pt-4">
//                 <Button
//                   type="submit"
//                   className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-200"
//                 >
//                   {isSignIn ? "Sign In" : "Sign Up"}
//                 </Button>
//               </div>

//               {isSignIn && (
//                 <div className="text-center pt-2">
//                   <Link
//                     to="/forgot-password"
//                     className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition duration-200"
//                   >
//                     Forgot Password?
//                   </Link>
//                 </div>
//               )}
//             </form>
//           </Form>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-gray-600">
//               {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
//               <Link
//                 to={isSignIn ? "/register" : "/login"}
//                 className="font-medium text-teal-600 hover:text-teal-800 hover:underline transition duration-200"
//               >
//                 {isSignIn ? "Sign Up" : "Sign In"}
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AuthForm;

import { useCallback } from "react";
import type {
  DefaultValues,
  FieldValues,
  Path,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { useForm } from "react-hook-form";
import { ZodType } from "zod";
import { Link } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";
import AsyncSelect from "react-select/async";
import { useNavigate } from "react-router-dom";
import { PhoneInput } from "../PhoneInput";
import { useState } from "react";
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
import { FIELD_NAMES, FIELD_TYPES } from "../../constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDonationOptions } from "../../hooks/useDonationOptions";
import { useCity } from "../../hooks/useCity";
import makeAnimated from "react-select/animated";
import Swal from "sweetalert2";
import Logo from "../../miscellaneous/Logo";

interface SelectOption {
  value: string;
  label: string;
}

interface Props<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
  type: "SIGN_IN" | "SIGN_UP";
}

type Role = "donor" | "recipient";

function AuthForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  type,
}: Props<T>) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSignIn = type === "SIGN_IN";
  const [apiError, setApiError] = useState<string | null>(null);
  const form: UseFormReturn<T> = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });
  const role = form.watch("role" as Path<T>) as Role;
  const { foodTypes, loading } = useDonationOptions();
  const { cities: allCities, loadingCities } = useCity();
  const animatedComponents = makeAnimated();

  const filterFoodTypes = useCallback(
    (inputValue: string) => {
      if (!inputValue) {
        return foodTypes.map((type) => ({ value: type, label: type }));
      }
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

  const filterCityTypes = useCallback(
    (inputValue: string) => {
      if (!inputValue) {
        return allCities.map((type) => ({ value: type, label: type }));
      }
      return allCities
        .filter((type) => type.toLowerCase().includes(inputValue.toLowerCase()))
        .map((type) => ({ value: type, label: type }));
    },
    [allCities]
  );

  const loadCityOptions = useCallback(
    (inputValue: string) =>
      new Promise<SelectOption[]>((resolve) => {
        resolve(filterCityTypes(inputValue));
      }),
    [filterCityTypes]
  );

  const handleSubmit: SubmitHandler<T> = async (data) => {
    console.log("FORM DATA", data);
    setApiError(null);

    const result = await onSubmit(data);

    if (result.success) {
      Swal.fire({
        title: "Success",
        text: isSignIn
          ? "You have successfully signed in."
          : "You have successfully signed up.",
        icon: "success",
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
      });
      setTimeout(() => {
        navigate("/home");
      }, 3000);
    } else {
      Swal.fire({
        title: `Error ${isSignIn ? "signing in" : "signing up"}`,
        text: result.error || "Something went wrong.",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    }
    setApiError(
      result.error ||
        `An unexpected error occurred during ${type.toLowerCase()}.`
    );
    console.error(`${type} failed:`, result.error);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo className="h-16 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">
            {isSignIn ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-gray-600 text-center">
            {isSignIn
              ? "Sign in to continue your food donation journey"
              : "Join our community to reduce food waste"}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {Object.keys(defaultValues)
                .filter((field) => field !== "role")
                .map((field) => {
                  if (
                    (field === "food_type" || field === "quantity") &&
                    role !== "recipient"
                  ) {
                    return null;
                  }
                  return (
                    <FormField
                      key={field}
                      control={form.control}
                      name={field as Path<T>}
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <div className="space-y-2">
                              {field.name !== "food_type" &&
                                field.name !== "city" && (
                                  <FormLabel className="text-sm font-medium text-gray-700">
                                    {
                                      FIELD_NAMES[
                                        field.name as keyof typeof FIELD_NAMES
                                      ]
                                    }
                                  </FormLabel>
                                )}
                              <FormControl>
                                {field.name === "contact_phone" ? (
                                  <PhoneInput
                                    {...field}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(
                                        /^0/,
                                        ""
                                      );
                                      field.onChange(val);
                                    }}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                ) : field.name === "food_type" ? (
                                  <AsyncSelect
                                    components={animatedComponents}
                                    isClearable
                                    isMulti
                                    cacheOptions
                                    defaultOptions
                                    isLoading={loading}
                                    loadOptions={loadOptions}
                                    value={(field.value || []).map(
                                      (val: string) => ({
                                        value: val,
                                        label: val,
                                      })
                                    )}
                                    onChange={(selectedOptions) => {
                                      field.onChange(
                                        selectedOptions.map(
                                          (option) => option.value
                                        )
                                      );
                                    }}
                                    onBlur={field.onBlur}
                                    placeholder="Type to search food types..."
                                    noOptionsMessage={() =>
                                      "No matching food types"
                                    }
                                    loadingMessage={() =>
                                      "Loading food types..."
                                    }
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        minHeight: "42px",
                                        borderColor: "#e2e8f0",
                                        borderRadius: "0.5rem",
                                        "&:hover": {
                                          borderColor: "#3b82f6",
                                        },
                                      }),
                                    }}
                                  />
                                ) : field.name === "city" ? (
                                  <AsyncSelect
                                    components={animatedComponents}
                                    isClearable
                                    cacheOptions
                                    defaultOptions
                                    isLoading={loadingCities}
                                    loadOptions={loadCityOptions}
                                    value={
                                      field.value
                                        ? {
                                            value: field.value as string,
                                            label: field.value as string,
                                          }
                                        : null
                                    }
                                    onChange={(
                                      selectedOption: SelectOption | null
                                    ) => {
                                      field.onChange(
                                        selectedOption
                                          ? selectedOption.value
                                          : ""
                                      );
                                    }}
                                    onBlur={field.onBlur}
                                    placeholder="Type to search for city..."
                                    noOptionsMessage={() =>
                                      "No matching cities"
                                    }
                                    loadingMessage={() => "Loading cities..."}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    styles={{
                                      control: (base) => ({
                                        ...base,
                                        minHeight: "42px",
                                        borderColor: "#e2e8f0",
                                        borderRadius: "0.5rem",
                                        "&:hover": {
                                          borderColor: "#3b82f6",
                                        },
                                      }),
                                    }}
                                  />
                                ) : (
                                  <Input
                                    required
                                    type={
                                      FIELD_TYPES[
                                        field.name as keyof typeof FIELD_TYPES
                                      ]
                                    }
                                    {...field}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                )}
                              </FormControl>
                              <FormMessage className="text-xs text-red-600" />
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  );
                })}

              {!isSignIn && (
                <div className="pt-2">
                  <FormField
                    control={form.control}
                    name={"role" as Path<T>}
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-3">
                          <FormLabel className="text-sm font-medium text-gray-700">
                            I want to join as a:
                          </FormLabel>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                value="donor"
                                checked={field.value === "donor"}
                                onChange={field.onChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Donor
                              </span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                value="recipient"
                                checked={field.value === "recipient"}
                                onChange={field.onChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Recipient
                              </span>
                            </label>
                          </div>
                        </div>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {apiError && (
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-sm text-red-600">{apiError}</p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all"
                >
                  {isSignIn ? "Sign In" : "Sign Up"}
                </Button>
              </div>

              {isSignIn && (
                <div className="text-center pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link
              to={isSignIn ? "/register" : "/login"}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {isSignIn ? "Sign up" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
