import type{
    DefaultValues,
    FieldValues,
    Path,
    SubmitHandler,
    UseFormReturn,
  } from "react-hook-form";
  import {useForm } from 'react-hook-form'
  import { ZodType } from "zod";
  import React,{useCallback} from "react";
  // import {DropdownMenu,DropdownMenuItem,DropdownMenuContent,DropdownMenuTrigger} from '../DropdownMenu'
  import { useNavigate } from "react-router-dom";
  // import {ChevronDown} from 'lucide-react'
  import AsyncSelect from "react-select/async";
  import makeAnimated from 'react-select/animated'
  import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "../Form";
  import { Input } from "../Input";
  import { useDonationOptions } from "../../hooks/useDonationOptions";
  import { Button } from "../Button";
  import { FIELD_NAMES, FIELD_TYPES } from "../../constants";
  import { zodResolver } from "@hookform/resolvers/zod";
  type Role = 'donor' | 'recipient';

  interface Props<T extends FieldValues> {
    schema: ZodType<T>;
    defaultValues: T;
    onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
  }

  interface SelectOption{
    value:string;
    label:string;
  }
  
  function EditProfileForm<T extends FieldValues>({
    schema,
    defaultValues,
    onSubmit,
  }: Props<T>) {
    const navigate = useNavigate();
    const {foodTypes,loading} = useDonationOptions()
    const form: UseFormReturn<T> = useForm<T>({
      resolver: zodResolver(schema),
      defaultValues: defaultValues as DefaultValues<T>,
    });
  
    const handleSubmit: SubmitHandler<T> = async (data) => {
      console.log("FORM DATA", data);
      const result = await onSubmit(data);
      if (result.success) {
        navigate("/view-profile");
      } else {
        console.error(result.error);
      }
    };
    
    const EditProfileFormFields = [
      "name",
      "contact_phone",
      "food_type",
      "quantity",
      "available",
    ] as const;
  
    
    const editProfileFieldTypes = EditProfileFormFields.reduce((acc, field) => {
      acc[field] = FIELD_TYPES[field];
      return acc;
    }, {} as Record<typeof EditProfileFormFields[number], string>);
    
    const editProfileFieldNames = EditProfileFormFields.reduce((acc, field) => {
      acc[field] = FIELD_NAMES[field];
      return acc;
    }, {} as Record<typeof EditProfileFormFields[number], string>);
    
    const r = form.watch("role" as Path<T>) as Role;
    
    const visibleFields = r === "donor"
    ? ["name", "contact_phone"]
    : ["name", "contact_phone", "food_type", "quantity"];
    
    const animatedComponents = makeAnimated()
    const filterFoodTypes = useCallback((inputValue: string) => {
             if (!inputValue) {
                 return foodTypes.map(type => ({ value: type, label: type }));
             }
         
             // Filter based on input value (case-insensitive)
             return foodTypes
               .filter(type => type.toLowerCase().includes(inputValue.toLowerCase()))
               .map(type => ({ value: type, label: type }));
           }, [foodTypes]); // Dependency on allFoodTypes to re-memoize if it changes
         
         
    const loadOptions = useCallback((inputValue: string) =>
             new Promise<SelectOption[]>(resolve => {
                 resolve(filterFoodTypes(inputValue));
             }),
           [filterFoodTypes]);

    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-white">
         Edit Your Profile
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="w-full space-y-6"
          >
            {visibleFields.map((fieldName) => (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName as Path<T>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">
                      {editProfileFieldNames[fieldName as keyof typeof editProfileFieldNames]}
                    </FormLabel>
                    <FormControl>
                      {(fieldName === "food_type") ? (
                        <AsyncSelect
                              components={animatedComponents}
                              isClearable
                              isMulti 
                              cacheOptions
                              defaultOptions 
                              isLoading={loading}
                              loadOptions={loadOptions} // THE CALLBACK TO FETCH OPTIONS
                              value={(field.value || []).map((val: string) => ({ value: val, label: val }))} // Pre-selects based on current form value (array of strings)
                              onChange={(selectedOptions) => {
                                // Update form field with array of selected option values
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
                      ) : (
                        <Input
                          // required
                          required={visibleFields.includes(fieldName)} 
                          type={editProfileFieldTypes[fieldName as keyof typeof editProfileFieldTypes]}
                          {...field}
                          className="form-input"
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            ))}
  
            <div className="text-gray-600 text-sm capitalize">
            <strong>Role:</strong> {r}
           </div>


            <Button type="submit" className="form-btn">
              Update Profile
            </Button>
          </form>
        </Form>
  
      </div>
    );
  };
  export default EditProfileForm;