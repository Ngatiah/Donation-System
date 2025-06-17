// import React from 'react';
// import { useNavigate } from 'react-router-dom';

// interface Donation {
//     id: number;
//     food_type: string;
//     quantity: number;
//     expiry_date: string;
//     food_description?: string;
//     created_at: string;
// }


// interface uploadedDonationsProps {
//     donations: Donation[];
// }


// const UploadedDonations: React.FC<uploadedDonationsProps> = ({ donations }) => {
//     const navigate = useNavigate()
//     return (
//         <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
//              {donations.length > 0 ? (
//                 donations.map((donation) => (
//                     <div key={donation.id} className="bg-white p-4 rounded shadow-lg text-left">
//                         <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
//                         <h3 className="font-semibold text-lg text-indigo-700">{donation.food_type}</h3>
                        
//                         <p className="text-sm text-gray-700">Quantity: {donation.quantity} kg</p>
//                         <p className="text-sm text-gray-600 italic mt-1">{donation.food_description}</p>
//                         <p className="text-xs text-gray-500 mt-1">Expires: {new Date(donation.expiry_date).toLocaleDateString()}</p>

//                         {/* actions buttons */}
//                         <div className='flex justify-between'>
//                         <button
//                             type='button'
//                             className={`mt-3 p-2 font-medium text-sm rounded transition w-20 bg-green-400 text-white hover:bg-green-500`}
//                             onClick={()=>navigate('/edit-donation')}
//                         >
//                             Edit
//                         </button>
//                         <button
//                             type='button'
//                             className={`mt-3 p-2 font-medium text-sm rounded transition w-20 bg-red-400 text-white hover:bg-red-500`}
//                         >
//                             Delete
//                         </button>

//                         </div>
//                     </div>
//                 ))
//             ) : (
                
//                 <div className="text-gray-500 col-span-3 mt-4 italic">
//                     You haven't added any donations yet. Click "New Donation" to get started!
//                 </div>
//             )}

//         </div>
//     );
// };

// export default UploadedDonations;





import React, { useState } from 'react';
import { toast } from 'react-hot-toast'; 
import { DonationFormData } from '../lib/validation';
import EditDonation from './EditDonation'
import { DonationApiPayload } from './EditDonation';
interface AuthContextType {
    token: string | null;
    // role: string | null; // e.g., 'donor', 'recipient', 'admin'
}

interface Donation {
    id: number;
    food_type: string;
    quantity: number;
    expiry_date: string; 
    food_description?: string; 
    created_at: string;
    is_claimed: boolean; 
    is_deleted:boolean;
    donor_name: string;
}

interface UploadedDonationsProps {
    donations: Donation[];
    onDonationUpdated: (updatedDonation: Donation) => void; 
    onDonationDeleted: (deletedDonationId: number) => void; 
    auth: AuthContextType; // Pass auth context/state
}


const UploadedDonations: React.FC<UploadedDonationsProps> = ({ donations, onDonationUpdated, onDonationDeleted, auth }) => {
    const { token } = auth;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentDonationToEdit, setCurrentDonationToEdit] = useState<DonationFormData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [editingDonationId, setEditingDonationId] = useState<number | null>(null);

    // DELETE MODAL
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [donationToDeleteId, setDonationToDeleteId] = useState<number | null>(null);


    // --- Core function to handle API calls for GET, PUT, PATCH, DELETE ---
    const handleDonationAction = async (
        donationId: number,
        method: 'GET' | 'PUT' | 'PATCH' | 'DELETE',
        // data?: Partial<DonationFormData> // Optional data for PUT/PATCH
        // data?: Partial<Donation> // Optional data for PUT/PATCH
        data?: Partial<DonationApiPayload> // Optional data for PUT/PATCH


    ) => {
        if (!token) {
            toast.error("You must be logged in to perform this action.");
            return;
        }


        setIsSubmitting(true); // Disable buttons during API call
        const url = `http://localhost:8003/FoodBridge/donations/update-donations/${donationId}/`; 

        try {
            const options: RequestInit = {
                method: method,
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            if (data && (method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const responseData = await response.json(); 

            if (!response.ok) {
                // Handle API errors
                const errorMessage = responseData?.detail || responseData?.message || `Failed to ${method} donation.`;
                toast.error(errorMessage);
                console.error(`API Error (${method} ${donationId}):`, responseData);
                return null; 
            }

            // --- Success handling based on method ---
            if (method === 'DELETE') {
                toast.success('Donation successfully deleted!');
                onDonationDeleted(donationId);
                return true; 
            } else if (method === 'GET') {
                //GET USED for  prefilling form 
                return responseData; 
            } else if (method === 'PUT' || method === 'PATCH') {
                toast.success('Donation successfully updated!');
                onDonationUpdated(responseData); 
                return responseData; 
            }

        } catch (err) {
            console.error(`[handleDonationAction] Unexpected error during ${method} for ${donationId}:`, err);
            toast.error(`An unexpected error occurred during ${method} operation.`);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Event Handlers for UI Actions ---
    // const handleDeleteClick = async (donationId: number) => {
    //     if (window.confirm("Are you sure you want to delete this donation? This action cannot be undone.")) {
    //         await handleDonationAction(donationId, 'DELETE');
    //     }
    // };
     const handleDeleteClick = (donationId: number) => {
        setDonationToDeleteId(donationId); 
        setIsDeleteModalOpen(true); 
    };

    const confirmDelete = async () => {
        if (donationToDeleteId !== null) {
            await handleDonationAction(donationToDeleteId, 'DELETE');
            // Close the modal after action
            setIsDeleteModalOpen(false);
            setDonationToDeleteId(null);
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setDonationToDeleteId(null);
    };

    const handleEditClick = async (donation: Donation) => {
        // We can directly use the donation object we already have,
        // or make a GET request to ensure we have the absolute latest data.
        // For simplicity, let's use the object passed in, but in a real app,
        // you might prefer a fresh GET.
        setEditingDonationId(donation.id)
        setCurrentDonationToEdit({
                food_type: donation.food_type,
                quantity: donation.quantity,
                expiry_date: new Date(donation.expiry_date), // Keep as string for input default value
                food_description: donation.food_description || '', // Ensure it's a string for input
            });
        setIsEditModalOpen(true);
        
    };
    
    // ensures no background loading
    React.useEffect(() => {
    document.body.style.overflow = isEditModalOpen ? 'hidden' : 'auto';
   }, [isEditModalOpen]);


    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-3">
            {donations.length > 0 ? (
                donations.map((donation) => (
                    <div key={donation.id} className="bg-white p-4 rounded shadow-lg text-left">
                        <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                         <h3 className="font-semibold text-lg text-indigo-700">{donation.food_type}</h3>
                        
                         {/* <p className="text-sm text-gray-700">Quantity: {donation.quantity} kg</p> */}
                         <p className="text-sm text-gray-600 italic mt-1">{donation.food_description}</p>
                         {/* <p className="text-xs text-gray-500 mt-1">Expires: {new Date(donation.expiry_date).toLocaleDateString()}</p> */}
                         <p className="text-xs text-gray-500 mt-1">Expires: {new Date(donation.expiry_date).toDateString().slice(4)}</p>
                        
                        {/* actions buttons */}
                        <div className='flex justify-between mt-3'>
                            <button
                                type='button'
                                className={`p-2 font-medium text-sm rounded transition w-20 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                                onClick={() => handleEditClick(donation)}
                                disabled={isSubmitting}
                            >
                                Edit
                            </button>
                            <button
                                type='button'
                                className={`p-2 font-medium text-sm rounded transition w-20 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                onClick={() => handleDeleteClick(donation.id)}
                                disabled={isSubmitting}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-gray-500 col-span-3 mt-4 italic">
                    You haven't added any donations yet. Click "New Donation" to get started!
                </div>
            )}

            {/* Edit Donation Modal/Form */}
            {isEditModalOpen && currentDonationToEdit && (
                // <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4 text-indigo-700">Edit Donation</h2>
                        <EditDonation 
                                initialValues={currentDonationToEdit}
                                onSubmit={async (updatedData) => {
                                      if (editingDonationId === null) {
                                        toast.error("Error: No donation ID found for update.");
                                        return { success: false }; // Indicate failure
                                       }

                                    const result = await handleDonationAction(editingDonationId, 'PUT', updatedData);
                                    if (result && typeof result === 'object') {
                                        setIsEditModalOpen(false);
                                        setCurrentDonationToEdit(null);
                                    }
                                    return { success: !!result, error: result ? undefined : "Update failed" };
                                }}
                                onClose={() => {
                                    setIsEditModalOpen(false);
                                    setCurrentDonationToEdit(null);
                                }}
                                />
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                        <h2 className="text-2xl font-bold mb-4 text-red-700">Confirm Deletion</h2>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this donation? This action **cannot be undone**.
                            It will also notify any recipients matched to it that it's no longer available.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                type="button"
                                className={`p-3 font-medium text-base rounded transition ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
                                onClick={cancelDelete}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`p-3 font-medium text-base rounded transition ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                onClick={confirmDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-1">
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        Deleting...
                                    </span>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadedDonations;