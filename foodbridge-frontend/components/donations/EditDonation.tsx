import React from 'react';
import DonationForm from '../UI/forms/DonationForm'; 
import { donationSchema, DonationFormData } from '../lib/validation';


// for api 
export interface DonationApiPayload {
    food_type: string;
    quantity: number;
    expiry_date: string; // This will be the 'YYYY-MM-DD' string
    food_description: string;
}

interface EditDonationProps {
  initialValues: DonationFormData; 
  onSubmit: (data: DonationApiPayload) => Promise<{ success: boolean; error?: string; data?: any }>; 
  onClose: () => void; 
}

const EditDonation: React.FC<EditDonationProps> = ({ initialValues, onSubmit, onClose }) => {
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
    quantity: typeof initialValues.quantity === 'string' ? parseInt(initialValues.quantity, 10) : initialValues.quantity,
  };


  // The onSubmit for DonationForm will trigger the onSubmit prop of EditDonation
  const handleFormSubmit = async (formData: DonationFormData) => {
    const cleanData : DonationApiPayload = {
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
        type='EDIT_DONATION'
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


































// import React, { useEffect, useState } from 'react';
// import DonationForm from '../UI/forms/DonationForm';
// import { getDonationById, putDonation } from '../lib/actions/donations'; // Assuming you have these
// import { useAuthStore } from '../../store/authStore';
// import { donationSchema, DonationFormData } from '../lib/validation';
// import { useParams } from 'react-router-dom';

// const EditDonation: React.FC = () => {
//   const { id } = useParams<{ id: string }>(); // Get ID from URL
//   const token = useAuthStore.getState().token;
//   const [initialDonationData, setInitialDonationData] = useState<DonationFormData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchDonation = async () => {
//       if (!id || !token) return;
//       setLoading(true);
//       setError(null);
//       const result = await getDonationById(id, token);
//       if (result.success && result.data) {
//         // --- IMPORTANT: Pre-process data for defaultValues ---
//         setInitialDonationData({
//           ...result.data,
//           quantity: parseInt(result.data.quantity, 10), // Ensure quantity is a number
//           expiry_date: new Date(result.data.expiry_date), // Ensure expiry_date is a Date object
//         });
//       } else {
//         setError(result.error || "Failed to load donation.");
//       }
//       setLoading(false);
//     };
//     fetchDonation();
//   }, [id, token]);

//   if (loading) {
//     return <div>Loading donation details...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   if (!initialDonationData) {
//     return <div>No donation found or loaded.</div>;
//   }

//   return (
//     <DonationForm
//       type='EDIT_DONATION'
//       schema={donationSchema}
//       defaultValues={initialDonationData}
//       onSubmit={async (formData) => {
//         const cleanData = {
//           ...formData,
//           // Ensure expiry_date is formatted back to string for the API
//           expiry_date: formData.expiry_date.toISOString().split("T")[0],
//         };
//         // Assuming `putDonation` is your update action
//         return putDonation(id!, cleanData, token);
//       }}
//     />
//   );
// };

// export default EditDonation;


// import React from 'react'
// import { donationSchema } from "../lib/validation";
// import DonationForm from '../UI/forms/DonationForm';
// import { DonationFormData } from '../lib/validation';


// const EditDonation = ({ initialValues, onSubmit, onClose }: {
//   initialValues: DonationFormData;
//   onSubmit: (data: DonationFormData) => Promise<{ success: boolean; error?: string }>;
//   onClose: () => void;
// }) => {
   
//   return (
//     <div className="modal">
//       <DonationForm
//         schema={donationSchema}
//         type="EDIT_DONATION"
//         defaultValues={initialValues}
//         onSubmit={onSubmit}
//       />
//       <button onClick={onClose} className="absolute top-2 right-2">×</button>
//     </div>
//   );
// };
// export default EditDonation;


// const EditDonation : React.FC = () => {
//   const token = useAuthStore.getState().token;
//   return (
//     <DonationForm
//     schema={donationSchema}
//     type='EDIT_DONATION'
//     defaultValues={{
//         food_type: '',
//         quantity: 0,
//         expiry_date: new Date(),
//         food_description: "",
//     }}
//     onSubmit={(formData) => {
//           const cleanData = {
//             ...formData,
//             expiry_date: formData.expiry_date.toISOString().split("T")[0],
//           };
//           return editDonation(cleanData, token);
//          }}
//     />
//   )
// };
// export default EditDonation;