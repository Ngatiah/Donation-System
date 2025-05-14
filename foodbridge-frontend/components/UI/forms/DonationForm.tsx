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
import {ChevronDown} from 'lucide-react'
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
  const {foodTypes} = useDonationOptions()
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

  const donationFormFields = [
    "food_type",
    "quantity",
    "expiry_date",
    "available",
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
                  <FormLabel className="capitalize">
                    {donationFieldNames[fieldName as keyof typeof donationFieldNames]}
                  </FormLabel>
                  <FormControl>
                    {(fieldName === "food_type") ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <button className="form-input flex justify-between items-center">
                            {/* {field.value || "Select"} */}
                            {field.value}
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {(foodTypes).map((option) => (
                            <DropdownMenuItem
                              key={option}
                              onSelect={() => field.onChange(option)}
                            >
                              {option}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Input
                        required
                        type={donationFieldTypes[fieldName as keyof typeof donationFieldTypes]}
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