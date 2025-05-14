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
  type Role = 'donor' | 'recipient';

  interface Props<T extends FieldValues> {
    schema: ZodType<T>;
    defaultValues: T;
    onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
  }
  
  function EditProfileForm<T extends FieldValues>({
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
    ? ["name", "contact_phone", "available"]
    : ["name", "contact_phone", "food_type", "quantity", "available"];

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