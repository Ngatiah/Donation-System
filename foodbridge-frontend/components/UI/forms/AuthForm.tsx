import React, {  useCallback } from 'react'; 
import type{
  DefaultValues,
  FieldValues,
  Path,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import {useForm } from 'react-hook-form'
import { ZodType } from "zod";
import {Link} from 'react-router-dom'
import {toast} from '../../hooks/use-toast'
// import{ toast } from'react-hot-toast';
// import CustomAsyncSelect  from "../CustomSelect";
import AsyncSelect from 'react-select/async';
import { useNavigate } from "react-router-dom";
import {PhoneInput} from '../PhoneInput'
import {useState} from 'react'
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
import { FIELD_NAMES, FIELD_TYPES } from "../../constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDonationOptions } from "../../hooks/useDonationOptions";
import { useCity } from "../../hooks/useCity";
import makeAnimated from 'react-select/animated'

// import { FileDiff } from "lucide-react";
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

type Role = 'donor' | 'recipient';

function AuthForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  type,
}: Props<T>) {
  const navigate = useNavigate();
  const isSignIn = type === "SIGN_IN";
  const [apiError,setApiError] = useState<string | null>(null)
  const form: UseFormReturn<T> = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });
  const role = form.watch('role' as Path<T>) as Role;
  const {foodTypes,loading} = useDonationOptions()
  const { cities : allCities, loadingCities } = useCity();
  const animatedComponents = makeAnimated()
  const filterFoodTypes = useCallback((inputValue: string) => {
  if (!inputValue) {
     return foodTypes.map(type => ({ value: type, label: type }));
         }
    // Filter based on input value (case-insensitive)
    return foodTypes
        .filter(type => type.toLowerCase().includes(inputValue.toLowerCase()))
               .map(type => ({ value: type, label: type }));
        }, [foodTypes]);
             
             
    const loadOptions = useCallback((inputValue: string) =>
                 new Promise<SelectOption[]>(resolve => {
                     resolve(filterFoodTypes(inputValue));
                 }),
        [filterFoodTypes]);
               

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

  const filterCityTypes = useCallback((inputValue: string) => {
  if (!inputValue) {
     return allCities.map(type => ({ value: type, label: type }));
         }
    // Filter based on input value (case-insensitive)
    return allCities
        .filter(type => type.toLowerCase().includes(inputValue.toLowerCase()))
               .map(type => ({ value: type, label: type }));
        }, [allCities]);
             
             
    const loadCityOptions = useCallback((inputValue: string) =>
                 new Promise<SelectOption[]>(resolve => {
                     resolve(filterCityTypes(inputValue));
                 }),
        [filterCityTypes]);

               


  const handleSubmit: SubmitHandler<T> = async (data) => {
    console.log("FORM DATA", data);
    setApiError(null)

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
      setApiError(result.error || `An unexpected error occurred during ${type.toLowerCase()}.`);
      console.error(`${type} failed:`, result.error);
    }
  };



  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-white">
        {isSignIn
          ? "Welcome Back to the FoodBridge"
          : "Create Your Donations Account"}
      </h1>
      <p className="text-light-100">
        {isSignIn
          ? "Welcome back! Log in to continue accessing the vast network of donors and recipients. Stay updated on real-time donation opportunities and help make a difference in people's lives."

          : "Create your Donations account and become a part of our compassionate community. "
          }
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full space-y-6"
        >
          {Object.keys(defaultValues)
        .filter((field) => field !== "role")
        .map((field) => {
          if ((field === 'food_type' || field === 'quantity') && role !== 'recipient') {
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
                   {field.name !== 'food_type' && field.name !== 'city' && <FormLabel className="capitalize">
                      {FIELD_NAMES[field.name as keyof typeof FIELD_NAMES]}
                    </FormLabel>}
                   {/* <FormLabel className="capitalize">
                      {FIELD_NAMES[field.name as keyof typeof FIELD_NAMES]}
                    </FormLabel> */}
                    <FormControl>
                    {field.name === 'contact_phone' ? (
                        <PhoneInput
                          {...field}
                          onChange={(e) => {
                            // Remove leading 0 if entered
                            const val = e.target.value.replace(/^0/, "");
                            field.onChange(val);
                          }}
                        />
                      ) 
                      : field.name === "food_type" ? (
                      <AsyncSelect
                              components={animatedComponents}
                              isClearable
                              isMulti 
                              cacheOptions 
                              defaultOptions 
                              isLoading={loading}
                              loadOptions={loadOptions} 
                              value={(field.value || []).map((val: string) => ({ value: val, label: val }))} 
                              onChange={(selectedOptions) => {
                                // This correctly ensures an array of strings is passed to formField.onChange
                                field.onChange(selectedOptions.map(option => option.value));
                              }}
                              onBlur={field.onBlur} // Important for react-hook-form validation
                              placeholder="Type to search food types..."
                              noOptionsMessage={() => "No matching food types"}
                              loadingMessage={() => "Loading food types..."}
                              // You might want to add custom styling props here
                              className="react-select-container" // For overall container styling
                              classNamePrefix="react-select" // For styling internal components
                            />
                    ) 
                    : field.name === "city" ? (
                      <AsyncSelect
                              components={animatedComponents}
                              isClearable
                              cacheOptions 
                              defaultOptions
                              isLoading={loadingCities}
                              loadOptions={loadCityOptions}
                              // value={field.value ? { value: field.value as string, label: field.value as string } : null}
                              // onChange={(selectedOption) => {
                              //   field.onChange(selectedOption ? selectedOption['value'] : null);
                              // }}
                              value={field.value ? { value: field.value as string, label: field.value as string } : null}   
                              onChange={(selectedOption: SelectOption | null) => {
                              field.onChange(selectedOption ? selectedOption.value : ''); 
                            }}                            
                              onBlur={field.onBlur} 
                              placeholder="Type to search for city..."
                              noOptionsMessage={() => "No matching cities"}
                              loadingMessage={() => "Loading cities..."}
                              className="react-select-container" 
                              classNamePrefix="react-select" 
                            />
                    ) 
                     :
                      (
                        <Input
                          required
                          type={FIELD_TYPES[field.name as keyof typeof FIELD_TYPES]}
                          {...field}
                          className="form-input"
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          );
        })}
      {!isSignIn && (
            <FormField
              control={form.control}
              name={"role" as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose your role</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="donor"
                          checked={field.value === "donor"}
                          onChange={field.onChange}
                        />
                        Donor
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="recipient"
                          checked={field.value === "recipient"}
                          onChange={field.onChange}
                        />
                        Recipient
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {apiError && (
            <div className="text-red-500 text-center font-medium mt-4">
              {apiError}
            </div>
          )}

          
          <Button type="submit" className="form-btn">
            {isSignIn ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-base font-medium">
        {isSignIn ? "No account yet?" : "Have an account already?"}{" "}
        <Link
        to={isSignIn ? "/register" : "/login"}
          className="font-bold text-primary"
        >
          {isSignIn ? "Sign Up" : "Sign In"}
        </Link>
      </p>
    </div>
  );
};
export default AuthForm;