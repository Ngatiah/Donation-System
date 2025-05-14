import type{
  DefaultValues,
  FieldValues,
  Path,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import {useForm } from 'react-hook-form'
import { ZodType } from "zod";
import {DropdownMenu,DropdownMenuItem,DropdownMenuContent,DropdownMenuTrigger} from '../DropdownMenu'
import { useNavigate } from "react-router-dom";
import { useDonationOptions } from "../../hooks/useDonationOptions";
import { useTimeRangeOptions } from "../../hooks/useTimeRange";
import { useAvailabilityOptions } from "../../hooks/useAvailability";
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

interface Props<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
}

function DonationForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
}: Props<T>) {
  const navigate = useNavigate();
  const form: UseFormReturn<T> = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  }); 

  const {foodTypes,loading} = useDonationOptions()
  const {timeRangeOptions,loadingTimeRanges} = useTimeRangeOptions();
  const {availabilityOptions,loadingAvailability} = useAvailabilityOptions()

  
  const handleSubmit: SubmitHandler<T> = async (data) => {
    console.log("FORM DATA", data);
    const result = await onSubmit(data);
    if (result.success) {
      navigate("/view-profile");
    } else {
      console.error(result.error);
    }
  };


  const donationFormFields = [
    "food_type",
    "quantity",
    "expiry_date",
    "availability",
    "time_range",
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
              name={fieldName as Path<T>}
              render={({ field }) => (
                <FormItem>
                 {fieldName !== "food_type" && fieldName !== "time_range" && fieldName !== "availability" && (
                    <FormLabel className="capitalize">
                      {donationFieldNames[fieldName as keyof typeof donationFieldNames]}
                    </FormLabel>
                  )}
                  <FormControl>
                    {fieldName === "food_type" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger 
                        aria-label="Select food type"
                        className="border border-gray-400 rounded min-w-[400px] max-h-60">
                          {field.value || "Select Food Type"}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-[200px] max-h-60 overflow-auto rounded-lg shadow-lg bg-white text-black p-2">
                          {loading ? (
                            <DropdownMenuItem disabled className="py-3 px-4 text-base">
                              Loading...
                            </DropdownMenuItem>
                          ) : (
                            foodTypes.map((option) => (
                              <DropdownMenuItem
                                key={option}
                                onSelect={() => field.onChange(option)}
                                className="py-3 px-4 text-base hover:bg-gray-100 cursor-pointer text-gray-600"
                              >
                                {option}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : fieldName === "food_description" ? (
                      <textarea
                        {...field}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter a brief description of the food..."
                      />
                    ) :  fieldName === 'time_range' ? (
                      <DropdownMenu>
                      <DropdownMenuTrigger 
                        aria-label="Select time slot"
                        className="border border-gray-400 rounded min-w-[400px] max-h-60"
                      >
                        {field.value?.label || "Select Time Range"}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="min-w-[200px] max-h-60 overflow-auto rounded-lg shadow-lg bg-white text-black p-2">
                        {loadingTimeRanges ? (
                          <DropdownMenuItem disabled className="py-3 px-4 text-base">
                            Loading...
                          </DropdownMenuItem>
                        ) : (
                          timeRangeOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.from}
                              onSelect={() => field.onChange(option)}
                              className="py-3 px-4 text-base hover:bg-gray-100 cursor-pointer text-gray-600"
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    ) :fieldName === 'availability' ? (
                      <DropdownMenu>
                      <DropdownMenuTrigger 
                        aria-label="Select available day"
                        className="border border-gray-400 rounded min-w-[400px] max-h-60"
                      >
                        {field.value?.label || "Select Available day"}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="min-w-[200px] max-h-60 overflow-auto rounded-lg shadow-lg bg-white text-black p-2">
                        {loadingAvailability ? (
                          <DropdownMenuItem disabled className="py-3 px-4 text-base">
                            Loading...
                          </DropdownMenuItem>
                        ) : (
                          availabilityOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.from}
                              onSelect={() => field.onChange(option)}
                              className="py-3 px-4 text-base hover:bg-gray-100 cursor-pointer text-gray-600"
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    ) 
                    :(
                      <Input
                        required
                        type={donationFieldTypes[fieldName]}
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

          <Button type="submit" className="form-btn">
            Donate
          </Button>
        </form>
      </Form>

    </div>
  );
};
export default DonationForm;