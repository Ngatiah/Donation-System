import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const allowedPaths = ["/home", "/view-more"];
  const redirectPath = allowedPaths.includes(location.state?.from)
    ? location.state.from
    : "/view-more";

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
  // const handleFormSubmit = async (formData: DonationFormData) => {
  //   const cleanData: DonationApiPayload = {
  //     ...formData,
  //     // Format expiry_date back to string for the API
  //     expiry_date: formData.expiry_date.toISOString().split("T")[0],

  //   };

  //   // Call the onSubmit prop passed from the parent (UploadedDonations)
  //   const result = await onSubmit(cleanData);
  //   // The parent will handle closing the modal if successful
  //   return result;
  // };
  const handleFormSubmit = async (formData: DonationFormData) => {
    const cleanData: DonationApiPayload & { image_url?: string } = {
      ...formData,
      expiry_date: formData.expiry_date.toISOString().split("T")[0],
    };

    if (typeof formData.image === "string") {
      cleanData.image_url = formData.image.startsWith("/")
        ? `${window.location.origin}${formData.image}`
        : formData.image;
    }

    const result = await onSubmit(cleanData);
    return result;
  };

  //   const handleFormSubmit = async (formData: DonationFormData) => {
  //   const formDataToSend = new FormData();

  //   formDataToSend.append("food_type", formData.food_type);
  //   formDataToSend.append("quantity", String(formData.quantity));
  //   formDataToSend.append("expiry_date", formData.expiry_date.toISOString().split("T")[0]);
  //   formDataToSend.append("food_description", formData.food_description || "");

  //   if (typeof formData.image === "string") {
  //     const imageUrl = formData.image.startsWith("/")
  //       ? `${window.location.origin}${formData.image}`
  //       : formData.image;
  //     formDataToSend.append("image_url", imageUrl);
  //   }

  //   const result = await onSubmit(formDataToSend);
  //   return result;
  // };

  const handleCancel = () => {
    onClose();
    navigate(redirectPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/100">
      <div className="w-full max-w-4xl mx-auto p-2 md:p-6">
        <DonationForm
          type="EDIT_DONATION"
          schema={donationSchema}
          defaultValues={preProcessedInitialValues} // Pass the pre-processed values
          onSubmit={handleFormSubmit}
          isModal={true}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EditDonation;
