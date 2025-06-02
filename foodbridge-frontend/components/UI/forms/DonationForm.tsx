import type{
  // DefaultValues,
  // FieldValues,
  Path,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import {useForm } from 'react-hook-form'
import React,{useCallback} from "react";
// import { ZodType } from "zod";
// import {DropdownMenu,DropdownMenuItem,DropdownMenuContent,DropdownMenuTrigger} from '../DropdownMenu'
import { useNavigate } from "react-router-dom";
import { useDonationOptions } from "../../hooks/useDonationOptions";
// import { useTimeRangeOptions } from "../../hooks/useTimeRange";
// import { useAvailabilityOptions } from "../../hooks/useAvailability";
import { DonationFormData } from "../../lib/validation";
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
import {ZodSchema} from 'zod'
import AsyncSelect from 'react-select/async'
import makeAnimated from 'react-select/animated'

interface Props {
  schema: ZodSchema;
  // schema: ZodTypeAny;
  // schema: ZodType<DonationFormData>;
  defaultValues: DonationFormData;
  onSubmit: (data: DonationFormData) => Promise<{ success: boolean; error?: string }>;
}

interface SelectOption{
  value:string;
  label:string;
}

function DonationForm({
  schema,
  defaultValues,
  onSubmit,
}: Props) {
  const navigate = useNavigate();
  const form: UseFormReturn<DonationFormData> = useForm<DonationFormData>({
    resolver: zodResolver(schema),
    // defaultValues: defaultValues as DefaultValues<DonationFormData>,
    defaultValues,

  }); 


  const {foodTypes,loading} = useDonationOptions()
  const animatedComponents = makeAnimated()
  // const filterFoodTypes = useCallback((inputValue: string) => {
  //    if (!inputValue) {
  //      return foodTypes.map(type => ({ value: type, label: type }));
  //     }           
               
  // return foodTypes.filter(type => type.toLowerCase().includes(inputValue.toLowerCase()))
  //                    .map(type => ({ value: type, label: type }));
  //                }, [foodTypes]); //                
                    
  // const loadOptions = useCallback((inputValue: string) =>
  //                  new Promise<SelectOption[]>(resolve => {
  //                      resolve(filterFoodTypes(inputValue));
  //                  }),
  //                [filterFoodTypes]);

  const filterFoodTypes = useCallback((inputValue: string): SelectOption[] => {
    if (!foodTypes || foodTypes.length === 0) {
      return []; // Return empty array if no options loaded yet
    }
    const filtered = foodTypes.filter(type =>
      type.toLowerCase().includes(inputValue.toLowerCase())
    );
    return filtered.map(type => ({ value: type, label: type }));
  }, [foodTypes]);

  const loadOptions = useCallback((inputValue: string) =>
    new Promise<SelectOption[]>(resolve => {
      resolve(filterFoodTypes(inputValue));
    }),
    [filterFoodTypes]
  );

  
  const handleSubmit: SubmitHandler<DonationFormData> = async (data) => {
    console.log("FORM DATA", data);
    const result = await onSubmit(data);
    if (result.success) {
      navigate("/home");
    } else {
      console.error(result.error);
    }
  };

  const donationFormFields = [
    "food_type",
    "quantity",
    "expiry_date",
    "food_description", 
  ] as const;

  
  const donationFieldTypes = donationFormFields.reduce((acc, field) => {
    acc[field] = FIELD_TYPES[field];
    return acc;
  }, {} as Record<typeof donationFormFields[number], string>);
  
  const donationFieldNames = donationFormFields.reduce((acc, field) => {
    acc[field] = FIELD_NAMES[field];
    return acc;
  }, {} as Record<typeof donationFormFields[number], string>);
  

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-white">
       DonationForm
      </h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full space-y-6"
        >
          {donationFormFields.map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control}
              name={fieldName as Path<DonationFormData>}
              render={({ field }) => (
                <FormItem>
                 {/* {fieldName !== "food_type" && fieldName !== "time_range" && ( */}
                 {fieldName !== "food_type" && (
                    <FormLabel className="capitalize">
                      {donationFieldNames[fieldName as keyof typeof donationFieldNames]}
                    </FormLabel>
                  )}
                  <FormControl>
                    {fieldName === "food_type" ? (
                     <AsyncSelect
                              cacheOptions 
                              defaultOptions
                              isLoading={loading}
                              isClearable
                              components={animatedComponents}
                              loadOptions={loadOptions}
                              // value={field.value ? { value: field.value, label: field.value } : null} 
                              value={field.value ? { value: field.value as string, label: field.value as string } : null}   
                              onChange={(selectedOption: SelectOption | null) => {
                              field.onChange(selectedOption ? selectedOption.value : ''); 
                            }}                 
                              onBlur={field.onBlur}
                              placeholder="Type to search food types..."
                              noOptionsMessage={() => "No matching food types"}
                              loadingMessage={() => "Loading food types..."}
                              className="react-select-container" // For overall container styling
                              classNamePrefix="react-select" // For styling internal components
                            />
                    ) : fieldName === "food_description" ? (
                      <textarea
                        {...field}
                        value={typeof field.value === "string" ? field.value : ""}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter a brief description of the food..."
                      />
                    ) 
                    // :  fieldName === 'time_range' ? (
                    //   <DropdownMenu>
                    //   <DropdownMenuTrigger 
                    //     aria-label="Select time slot"
                    //     className="border border-gray-400 rounded min-w-[400px] max-h-100"
                    //     // asChild
                    //   >
                    //     {/* {field.value?.label ?? "Select Time Range"} */}
                    //     {typeof field.value === "object" && field.value !== null && "label" in field.value
                    //                 ? field.value.label
                    //                 : "Select Time Range"}
                    //   </DropdownMenuTrigger>
                    //   <DropdownMenuContent className="min-w-[200px] max-h-60 overflow-auto rounded-lg shadow-lg bg-white text-black p-2">
                    //     {loadingTimeRanges ? (
                    //       <DropdownMenuItem disabled className="py-3 px-4 text-base">
                    //         Loading...
                    //       </DropdownMenuItem>
                    //     ) : (
                    //       timeRangeOptions.map((option) => (
                    //         <DropdownMenuItem
                    //           key={option.from}
                    //           onSelect={() => field.onChange(option)}
                    //           className="py-3 px-4 text-base hover:bg-gray-100 cursor-pointer text-gray-600"
                    //         >
                    //           {option.label}
                    //         </DropdownMenuItem>
                    //       ))
                    //     )}
                    //   </DropdownMenuContent>
                    // </DropdownMenu>
                    // ) 
                    :(                   
                      <Input
                        required
                        // value={field.value ?? ""}
                        value={typeof field.value === "object" ? "" : field.value ?? ""}
                        name={field.name}
                        type={donationFieldTypes[fieldName]}
                        // {...field}
                        className="form-input"
                        onChange={field.onChange}
                        // onBlur={field.onBlur}
                        // ref={field.ref}
                      />
                    )}
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" className="form-btn">
            Donate
          </Button>
        </form>
      </Form>

    </div>
  );
};
export default DonationForm;