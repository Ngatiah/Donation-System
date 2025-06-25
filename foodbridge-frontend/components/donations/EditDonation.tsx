import React from "react";
import DonationForm from "../UI/forms/DonationForm";
import { donationSchema, type DonationFormData } from "../lib/validation";

// for api
export interface DonationApiPayload {
  food_type: string;
  quantity: number;
  expiry_date: string; // This will be the 'YYYY-MM-DD' string
  food_description: string;
}

interface EditDonationProps {
  initialValues: DonationFormData;
  onSubmit: (
    data: DonationApiPayload
  ) => Promise<{ success: boolean; error?: string; data?: any }>;
  onClose: () => void;
}

const EditDonation: React.FC<EditDonationProps> = ({
  initialValues,
  onSubmit,
  onClose,
}) => {
  // The defaultValues for DonationForm should be pre-processed here
  // to ensure expiry_date is a Date object and quantity is a number.
  // The initialValues prop will be coming from UploadedDonations
  // and will have expiry_date as a string and quantity as a number.
  // We need to ensure DonationForm receives it in the correct types.

  const preProcessedInitialValues: DonationFormData = {
    ...initialValues,
    // Convert expiry_date string to Date object
    expiry_date: new Date(initialValues.expiry_date),
    // Ensure quantity is a number (though it should already be from UploadedDonations)
    quantity:
      typeof initialValues.quantity === "string"
        ? parseInt(initialValues.quantity, 10)
        : initialValues.quantity,
  };

  // The onSubmit for DonationForm will trigger the onSubmit prop of EditDonation
  const handleFormSubmit = async (formData: DonationFormData) => {
    const cleanData: DonationApiPayload = {
      ...formData,
      // Format expiry_date back to string for the API
      expiry_date: formData.expiry_date.toISOString().split("T")[0],
    };

    // Call the onSubmit prop passed from the parent (UploadedDonations)
    const result = await onSubmit(cleanData);
    // The parent will handle closing the modal if successful
    return result;
  };

  return (
    <div>
      <DonationForm
        type="EDIT_DONATION"
        schema={donationSchema}
        defaultValues={preProcessedInitialValues} // Pass the pre-processed values
        onSubmit={handleFormSubmit}
      />
      {/* Add a close button for the modal */}
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
      >
        Cancel
      </button>
    </div>
  );
};

export default EditDonation;
