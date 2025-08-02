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
                          // value={field.value as string | number}
                          value={
                            fieldName === "expiry_date" && field.value instanceof Date
                              ? field.value.toISOString().split("T")[0] // format as string "YYYY-MM-DD"
                              : field.value as string | number
                          }
                          onChange={(e) => {
                            field.onChange(e.target.value); // let z.coerce.date() do the conversion
                          }}
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
