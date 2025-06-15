import { useCallback } from "react";
import { toast } from "../../hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";

import makeAnimated from "react-select/animated";
import type {
  DefaultValues,
  FieldValues,
  Path,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";
// import{ toast } from'react-hot-toast';
// import CustomAsyncSelect  from "../CustomSelect";
import AsyncSelect from "react-select/async";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
// import {DropdownMenu,DropdownMenuItem,DropdownMenuContent,DropdownMenuTrigger} from '../DropdownMenu'
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
import { PhoneInput } from "../PhoneInput";
import { FIELD_NAMES, FIELD_TYPES } from "../../constants";
import { useDonationOptions } from "../../hooks/useDonationOptions";
import { useCity } from "../../hooks/useCity";
import Logo from "../../../components/miscellaneous/Logo";
import { ZodType } from "zod";

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
      // Filter based on input value (case-insensitive)
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

  //   const cityOptions = allCities.map(city => ({ value: city, label: city }));
  //   const loadCityOptions = (inputValue: string) => {
  //   return new Promise<SelectOption[]>(resolve => {
  //     // Filter cities based on inputValue (optional)
  //     const filtered = allCities
  //       .filter(city => city.toLowerCase().includes(inputValue.toLowerCase()))
  //       .map(city => ({ value: city, label: city }));
  //     resolve(filtered);
  //   });
  // };

  // const filterCityTypes = useCallback((inputValue: string): SelectOption[] => {
  //     if (!allCities || allCities.length === 0) {
  //       return []; // Return empty array if no options loaded yet
  //     }
  // const filtered = allCities.filter(type =>
  //       type.toLowerCase().includes(inputValue.toLowerCase())
  //     );
  //     return filtered.map(type => ({ value: type, label: type }));
  //   }, [allCities]);

  //   const loadCityOptions = useCallback((inputValue: string) =>
  //     new Promise<SelectOption[]>(resolve => {
  //       resolve(filterCityTypes(inputValue));
  //     }),
  //     [filterCityTypes]
  //   );

  const filterCityTypes = useCallback(
    (inputValue: string) => {
      if (!inputValue) {
        return allCities.map((type) => ({ value: type, label: type }));
      }
      // Filter based on input value (case-insensitive)
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
      toast({
        title: "Success",
        description: isSignIn
          ? "You have successfully signed in."
          : "You have successfully signed up.",
      });
      navigate("/home");
    } else {
      toast({
        title: `Error ${isSignIn ? "signing in" : "signing up"}`,
        description: result.error,
        variant: "destructive",
      });
      setApiError(
        result.error ||
          `An unexpected error occurred during ${type.toLowerCase()}.`
      );
      console.error(`${type} failed:`, result.error);
    }
  };

  // ... (keep your existing callbacks and handlers)

  return (
    <div className="min-h-screen  flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="lg" /> {/* Using the Logo component */}
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignIn ? "Welcome Back to FoodBridge" : "Create Your Account"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignIn
            ? "Log in to connect with donors and recipients, track donations, and make a difference."
            : "Join our community to reduce food waste and help those in need."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl sm:px-10">
          <p className="text-center text-sm text-gray-600 mb-6">
            {isSignIn
              ? "Don't have an account yet?"
              : "Already have an account?"}{" "}
            <Link
              to={isSignIn ? "/register" : "/login"}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              {isSignIn ? "Sign Up" : "Sign In"}
            </Link>
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
            >
              {!isSignIn && (
                <FormField
                  control={form.control}
                  name={"role" as Path<T>}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-gray-700">
                        Choose your role
                      </FormLabel>
                      <div className="mt-2 flex space-x-6">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            value="donor"
                            checked={field.value === "donor"}
                            onChange={field.onChange}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Donor
                          </span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            value="recipient"
                            checked={field.value === "recipient"}
                            onChange={field.onChange}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Recipient
                          </span>
                        </label>
                      </div>
                      <FormMessage className="text-red-600 text-xs mt-1" />
                    </FormItem>
                  )}
                />
              )}

              {Object.keys(defaultValues)
                .filter((field) => field !== "role")
                .map((field) => {
                  if (
                    (field === "food_type" || field === "quantity") &&
                    role !== "recipient"
                  )
                    return null;

                  return (
                    <FormField
                      key={field}
                      control={form.control}
                      name={field as Path<T>}
                      render={({ field }) => (
                        <FormItem>
                          {field.name !== "food_type" &&
                            field.name !== "city" && (
                              <FormLabel className="block text-sm font-medium text-gray-700">
                                {
                                  FIELD_NAMES[
                                    field.name as keyof typeof FIELD_NAMES
                                  ]
                                }
                              </FormLabel>
                            )}
                          <FormControl className="mt-1">
                            {field.name === "contact_phone" ? (
                              <PhoneInput
                                {...field}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                                className="react-select-container"
                                classNamePrefix="react-select"
                              />
                            ) : field.name === "city" ? (
                              <AsyncSelect
                                components={animatedComponents}
                                isClearable
                                cacheOptions
                                defaultOptions
                                isLoading={loadingCities}
                                loadOptions={loadCityOptions}
                                className="react-select-container"
                                classNamePrefix="react-select"
                              />
                            ) : (
                              <Input
                                type={
                                  FIELD_TYPES[
                                    field.name as keyof typeof FIELD_TYPES
                                  ]
                                }
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                {...field}
                              />
                            )}
                          </FormControl>
                          <FormMessage className="text-red-600 text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                  );
                })}

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  {isSignIn ? "Sign In" : "Sign Up"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
