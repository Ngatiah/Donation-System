import React from 'react';

interface Donation {
    id: number;
    food_type: string;
    quantity: number;
    expiry_date: string;
    food_description?: string;
    created_at: string;
}


interface uploadedDonationsProps {
    donations: Donation[];
}


const UploadedDonations: React.FC<uploadedDonationsProps> = ({ donations }) => {
    // const [updateDonationId,setUpdateDonationId] = React.useState<number || null>()

    // const UpdateDonation = async (donationId: number) => {
    //     if (!token) {
    //         toast.error("You must be logged in to update a donation.");
    //         return;
    //     }

    // if (!role == 'donor') {
    //         toast.error("You must be a donor to perform actions on donation(s).");
    //         return;
    //     }

    //     try {
    //         setClaimingId(matchId);
    //         const response = await fetch(`http://localhost:8003/FoodBridge/donations/update-donations/${donationId}/`, {
    //             method: 'PUT' \\ PATCH || GET \\ DELETE,
    //             headers: {
    //                 'Authorization': `Token ${token}`,
    //                 'Content-Type': 'application/json',
    //             },
    //         });

    //         const data = await response.json();

    //         if (response.ok) {
    //             toast.success('Donation successfully claimed!');
    //             // Update local state: mark as claimed
    //             setMatches(prevMatches =>
    //                 prevMatches.map(match =>
    //                     match.id === matchId ? { ...match, is_claimed: true } : match
    //                 ).filter(match => !match.is_claimed) // Filter out the claimed match from display
    //             );
    //             // Call callback to inform parent (Dashboard)
    //             onClaimSuccess(matchId);
    //         } else {
    //             toast.error(data?.detail || data?.message || "Failed to claim donation");
    //         }
    //     } catch (err) {
    //         console.error(`[claimDonation] Unexpected error:`, err);
    //         toast.error("An unexpected error occurred while claiming donation.");
    //     } finally {
    //         setClaimingId(null);
    //     }
    // };
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
            {/* {donations.length > 0 ? (
                donations.map((donation) => (
                    <div key={donation.id} className="bg-white p-4 rounded shadow text-left">
                        <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                        <h3 className="font-semibold">{donation.food_type}</h3>
                        <h3 className="font-semibold">Quantity : {donation.quantity}</h3>
                        Expires: <strong>{new Date(donation.expiry_date).toLocaleString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
                        })}</strong>
                    </div>
                ))
            ) : (
                <div className="text-gray-500 col-span-3 mt-4 italic">
                    You haven't added any donations yet. Click "New Donation" to get started!
                </div>
            )} */}
             {donations.length > 0 ? (
                donations.map((donation) => (
                    <div key={donation.id} className="bg-white p-4 rounded shadow-lg text-left">
                        <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                        <h3 className="font-semibold text-lg text-indigo-700">{donation.food_type}</h3>
                        
                        <p className="text-sm text-gray-700">Quantity: {donation.quantity} kg</p>
                        <p className="text-sm text-gray-600 italic mt-1">{donation.food_description}</p>
                        <p className="text-xs text-gray-500 mt-1">Expires: {new Date(donation.expiry_date).toLocaleDateString()}</p>

                        {/* actions buttons */}
                        <div className='flex justify-between'>
                        <button
                            type='button'
                            className={`mt-3 p-2 font-medium text-sm rounded transition w-20 bg-green-400 text-white hover:bg-green-500`}
                        >
                            Edit
                        </button>
                        <button
                            type='button'
                            className={`mt-3 p-2 font-medium text-sm rounded transition w-20 bg-red-400 text-white hover:bg-red-500`}
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

        </div>
    );
};

export default UploadedDonations;



// // action endpoint : donations/<int:pk>/</int:pk>


// // ${
//                                 // match.is_claimed || claimingId === match.id
//                                 //     ? 'bg-gray-400 cursor-not-allowed'
//                                 //     : 'bg-yellow-400 text-white hover:bg-yellow-500'
//                                 // }
//                             // disabled={match.is_claimed || claimingId === match.id}
//                             // onClick={() => claimDonation(match.id)}

// {/* {role === 'donor' && (
//                         <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
//                             {donations?.map((donation) => (
//                                 <div key={donation.id} className="bg-white p-4 rounded shadow text-left">
//                                     <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
//                                     <h3 className="font-semibold">{donation.food_type}</h3>
//                                     <h3 className="font-semibold">Quantity : {donation.quantity}</h3>
//                                     Expires: <strong>{new Date(donation.expiry_date).toLocaleString(undefined, {
//                                         year: 'numeric', month: 'short', day: 'numeric'
//                                     })}</strong>
//                                 </div>
//                             ))}

//                             {donations?.length === 0 && donorMatches.length === 0 && (
//                                 <div className="text-gray-500 col-span-3 mt-4">
//                                     You haven't added any donations or had any matches yet. Click "New Donation" to get started!
//                                 </div>
//                             )}

//                             {donorMatches.length > 0 && (
//                                 <div className="col-span-3 mt-4">
//                                     <h3 className="text-2xl/8 font-bold mb-3 text-left px-2">Your Match History (As Donor)</h3>
//                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                         {donorMatches.map(match => (
//                                             <div key={match.id} className="bg-white p-4 rounded shadow-lg text-left">
//                                                 <h3 className="font-semibold text-lg text-green-700">{match.food_type}</h3>
//                                                 <p className="text-sm text-gray-600">Recipient: <span className="font-medium">{match.recipient_name}</span></p>
//                                                 <p className="text-sm text-gray-700">Quantity: {match.matched_quantity} kg</p>
//                                                 <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
//                                                 <p className="text-xs text-gray-500 mt-1">Status: <span className={`font-semibold ${match.is_claimed ? 'text-green-600' : 'text-orange-500'}`}>{match.is_claimed ? 'Claimed' : 'Pending Claim'}</span></p>
//                                                 <p className="text-xs text-gray-500">Matched On: {new Date(match.created_at).toLocaleDateString()}</p>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     )} */}


// import React, { useState } from 'react';
// import { toast } from 'react-hot-toast'; // Assuming you have react-hot-toast for notifications
// import { useNavigate } from 'react-router-dom'; // If you need to navigate after actions

// // Assuming these are passed via props or context
// interface AuthContextType {
//     token: string | null;
//     role: string | null; // e.g., 'donor', 'recipient', 'admin'
// }

// // Full Donation interface, including optional fields for editing
// interface Donation {
//     id: number;
//     food_type: string;
//     quantity: number;
//     expiry_date: string; // Keep as string for API, convert to Date for display
//     food_description?: string; // Optional field
//     created_at: string;
//     is_claimed: boolean; // From your backend model
//     donor_name: string; // Read-only, from serializer
// }

// // Props for the UploadedDonations component
// interface UploadedDonationsProps {
//     donations: Donation[];
//     onDonationUpdated: (updatedDonation: Donation) => void; // Callback for parent to update state
//     onDonationDeleted: (deletedDonationId: number) => void; // Callback for parent to remove from state
//     auth: AuthContextType; // Pass auth context/state
// }

// // State for the edit modal/form
// interface EditDonationFormState {
//     id: number;
//     food_type: string;
//     quantity: number;
//     expiry_date: string;
//     food_description: string; // Include for editing
// }

// const UploadedDonations: React.FC<UploadedDonationsProps> = ({ donations, onDonationUpdated, onDonationDeleted, auth }) => {
//     const { token, role } = auth;
//     const navigate = useNavigate(); // For navigation, if needed

//     // State to manage the currently edited donation (for the edit modal/form)
//     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//     const [currentDonationToEdit, setCurrentDonationToEdit] = useState<EditDonationFormState | null>(null);
//     const [isSubmitting, setIsSubmitting] = useState(false); // To prevent multiple submissions

//     // --- Core function to handle API calls for GET, PUT, PATCH, DELETE ---
//     const handleDonationAction = async (
//         donationId: number,
//         method: 'GET' | 'PUT' | 'PATCH' | 'DELETE',
//         data?: Partial<Donation> // Optional data for PUT/PATCH
//     ) => {
//         if (!token) {
//             toast.error("You must be logged in to perform this action.");
//             return;
//         }

//         if (role !== 'donor') { 
//             toast.error("You must be a donor to manage donations.");
//             return;
//         }

//         setIsSubmitting(true); // Disable buttons during API call
//         const url = `http://localhost:8000/api/donations/update-donations/${donationId}/`; // Your backend endpoint

//         try {
//             const options: RequestInit = {
//                 method: method,
//                 headers: {
//                     'Authorization': `Token ${token}`,
//                     'Content-Type': 'application/json',
//                 },
//             };

//             if (data && (method === 'PUT' || method === 'PATCH')) {
//                 options.body = JSON.stringify(data);
//             }

//             const response = await fetch(url, options);
//             const responseData = await response.json(); // Always parse response to check for errors

//             if (!response.ok) {
//                 // Handle API errors
//                 const errorMessage = responseData?.detail || responseData?.message || `Failed to ${method} donation.`;
//                 toast.error(errorMessage);
//                 console.error(`API Error (${method} ${donationId}):`, responseData);
//                 return null; // Return null on error
//             }

//             // --- Success handling based on method ---
//             if (method === 'DELETE') {
//                 toast.success('Donation successfully deleted!');
//                 onDonationDeleted(donationId); // Update parent component's state
//                 return true; // Indicate success
//             } else if (method === 'GET') {
//                 // For GET, we're likely fetching data to prefill the form
//                 return responseData; // Return the fetched donation data
//             } else if (method === 'PUT' || method === 'PATCH') {
//                 toast.success('Donation successfully updated!');
//                 onDonationUpdated(responseData); // Update parent component's state with new data
//                 return responseData; // Return the updated donation data
//             }

//         } catch (err) {
//             console.error(`[handleDonationAction] Unexpected error during ${method} for ${donationId}:`, err);
//             toast.error(`An unexpected error occurred during ${method} operation.`);
//             return null; // Return null on unexpected error
//         } finally {
//             setIsSubmitting(false); // Re-enable buttons
//         }
//     };

//     // --- Event Handlers for UI Actions ---

//     const handleDeleteClick = async (donationId: number) => {
//         if (window.confirm("Are you sure you want to delete this donation? This action cannot be undone.")) {
//             await handleDonationAction(donationId, 'DELETE');
//         }
//     };

//     const handleEditClick = async (donation: Donation) => {
//         // We can directly use the donation object we already have,
//         // or make a GET request to ensure we have the absolute latest data.
//         // For simplicity, let's use the object passed in, but in a real app,
//         // you might prefer a fresh GET.
//         setCurrentDonationToEdit({
//             id: donation.id,
//             food_type: donation.food_type,
//             quantity: donation.quantity,
//             expiry_date: donation.expiry_date, // Keep as string for input default value
//             food_description: donation.food_description || '', // Ensure it's a string for input
//         });
//         setIsEditModalOpen(true);
//     };

//     const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         const { name, value } = e.target;
//         setCurrentDonationToEdit(prevState => ({
//             ...prevState!, // Non-null assertion as this will only be called when state is not null
//             [name]: value,
//         }));
//     };

//     const handleEditFormSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!currentDonationToEdit) return;

//         const updatedData: Partial<Donation> = {
//             food_type: currentDonationToEdit.food_type,
//             quantity: currentDonationToEdit.quantity,
//             expiry_date: currentDonationToEdit.expiry_date,
//             food_description: currentDonationToEdit.food_description,
//             // is_claimed is not typically updated by donor via this form, but can be added if needed
//         };

//         const result = await handleDonationAction(currentDonationToEdit.id, 'PUT', updatedData); // Or 'PATCH' if only sending changed fields

//         if (result) {
//             setIsEditModalOpen(false); // Close modal on success
//             setCurrentDonationToEdit(null);
//         }
//     };

//     return (
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-3">
//             {donations.length > 0 ? (
//                 donations.map((donation) => (
//                     <div key={donation.id} className="bg-white p-4 rounded shadow-lg text-left">
//                         <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
//                         <h3 className="font-semibold text-lg text-indigo-700">{donation.food_type}</h3>

//                         <p className="text-sm text-gray-700">Quantity: {donation.quantity} kg</p>
//                         <p className="text-sm text-gray-600 italic mt-1">{donation.food_description}</p>
//                         <p className="text-xs text-gray-500 mt-1">Expires: {new Date(donation.expiry_date).toLocaleDateString()}</p>
//                         <p className="text-xs text-gray-500 mt-1">Claimed: {donation.is_claimed ? 'Yes' : 'No'}</p>


//                         {/* actions buttons */}
//                         <div className='flex justify-between mt-3'>
//                             <button
//                                 type='button'
//                                 className={`p-2 font-medium text-sm rounded transition w-20 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
//                                 onClick={() => handleEditClick(donation)}
//                                 disabled={isSubmitting}
//                             >
//                                 Edit
//                             </button>
//                             <button
//                                 type='button'
//                                 className={`p-2 font-medium text-sm rounded transition w-20 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
//                                 onClick={() => handleDeleteClick(donation.id)}
//                                 disabled={isSubmitting}
//                             >
//                                 Delete
//                             </button>
//                         </div>
//                     </div>
//                 ))
//             ) : (
//                 <div className="text-gray-500 col-span-3 mt-4 italic">
//                     You haven't added any donations yet. Click "New Donation" to get started!
//                 </div>
//             )}

//             {/* Edit Donation Modal/Form */}
//             {isEditModalOpen && currentDonationToEdit && (
//                 <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
//                     <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
//                         <h2 className="text-2xl font-bold mb-4 text-indigo-700">Edit Donation</h2>
//                         <form onSubmit={handleEditFormSubmit}>
//                             <div className="mb-4">
//                                 <label htmlFor="food_type" className="block text-gray-700 text-sm font-bold mb-2">Food Type:</label>
//                                 <input
//                                     type="text"
//                                     name="food_type"
//                                     id="food_type"
//                                     value={currentDonationToEdit.food_type}
//                                     onChange={handleEditFormChange}
//                                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                                     required
//                                 />
//                             </div>
//                             <div className="mb-4">
//                                 <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity (kg):</label>
//                                 <input
//                                     type="number"
//                                     name="quantity"
//                                     id="quantity"
//                                     value={currentDonationToEdit.quantity}
//                                     onChange={handleEditFormChange}
//                                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                                     required
//                                     step="0.01" // Allow decimal quantities
//                                 />
//                             </div>
//                             <div className="mb-4">
//                                 <label htmlFor="expiry_date" className="block text-gray-700 text-sm font-bold mb-2">Expiry Date:</label>
//                                 <input
//                                     type="date"
//                                     name="expiry_date"
//                                     id="expiry_date"
//                                     value={currentDonationToEdit.expiry_date}
//                                     onChange={handleEditFormChange}
//                                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                                     required
//                                 />
//                             </div>
//                             <div className="mb-4">
//                                 <label htmlFor="food_description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
//                                 <textarea
//                                     name="food_description"
//                                     id="food_description"
//                                     value={currentDonationToEdit.food_description}
//                                     onChange={handleEditFormChange}
//                                     className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                                     rows={3}
//                                 />
//                             </div>
//                             <div className="flex justify-end gap-2">
//                                 <button
//                                     type="button"
//                                     onClick={() => setIsEditModalOpen(false)}
//                                     className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                                     disabled={isSubmitting}
//                                 >
//                                     Cancel
//                                 </button>
//                                 <button
//                                     type="submit"
//                                     className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                                     disabled={isSubmitting}
//                                 >
//                                     {isSubmitting ? 'Saving...' : 'Save Changes'}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default UploadedDonations;