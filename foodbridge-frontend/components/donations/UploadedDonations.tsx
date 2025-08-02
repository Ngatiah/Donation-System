import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import type { DonationFormData } from "../lib/validation";
import EditDonation from "./EditDonation";
import type { DonationApiPayload } from "./EditDonation";
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
  is_deleted: boolean;
  donor_name: string;
}

interface UploadedDonationsProps {
  donations: Donation[];
  onDonationUpdated: (updatedDonation: Donation) => void;
  onDonationDeleted: (deletedDonationId: number) => void;
  auth: AuthContextType; // Pass auth context/state
}

const UploadedDonations: React.FC<UploadedDonationsProps> = ({
  donations,
  onDonationUpdated,
  onDonationDeleted,
  auth,
}) => {
  const { token } = auth;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDonationToEdit, setCurrentDonationToEdit] =
    useState<DonationFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDonationId, setEditingDonationId] = useState<number | null>(
    null
  );
  const [, setVisibleDonationsCount] = useState(3); // Default to 3
  // DELETE MODAL
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [donationToDeleteId, setDonationToDeleteId] = useState<number | null>(
    null
  );
  // const [maxVisibleItems] = useState(3);
  // const visibleDonations = donations.slice(0, maxVisibleItems);

  // --- Core function to handle API calls for GET, PUT, PATCH, DELETE ---
  const handleDonationAction = async (
    donationId: number,
    method: "GET" | "PUT" | "PATCH" | "DELETE",
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
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      };

      if (data && (method === "PUT" || method === "PATCH")) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        // Handle API errors
        const errorMessage =
          responseData?.detail ||
          responseData?.message ||
          `Failed to ${method} donation.`;
        toast.error(errorMessage);
        console.error(`API Error (${method} ${donationId}):`, responseData);
        return null;
      }

      // --- Success handling based on method ---
      if (method === "DELETE") {
        toast.success("Donation successfully deleted!");
        onDonationDeleted(donationId);
        return true;
      } else if (method === "GET") {
        //GET USED for  prefilling form
        return responseData;
      } else if (method === "PUT" || method === "PATCH") {
        toast.success("Donation successfully updated!");
        onDonationUpdated(responseData);
        return responseData;
      }
    } catch (err) {
      console.error(
        `[handleDonationAction] Unexpected error during ${method} for ${donationId}:`,
        err
      );
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
      await handleDonationAction(donationToDeleteId, "DELETE");
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
    setEditingDonationId(donation.id);
    setCurrentDonationToEdit({
      food_type: donation.food_type,
      quantity: donation.quantity,
      expiry_date: new Date(donation.expiry_date), // Keep as string for input default value
      food_description: donation.food_description || "", // Ensure it's a string for input
    });
    setIsEditModalOpen(true);
  };
  const [viewingDonation, setViewingDonation] = useState<Donation | null>(null);

  // Calculate how many donations can fit based on container width
  // useEffect(() => {
  //   const updateVisibleCount = () => {
  //     const container = document.getElementById("donations-container");
  //     if (!container) return;

  //     const containerWidth = container.clientWidth;
  //     const cardWidth = 288; // Approximate width of each card (including margins)
  //     const maxVisible = Math.floor(containerWidth / cardWidth);

  //     setVisibleDonationsCount(Math.max(1, maxVisible)); // Always show at least 1
  //   };

  //   updateVisibleCount();
  //   window.addEventListener("resize", updateVisibleCount);
  //   return () => window.removeEventListener("resize", updateVisibleCount);
  // }, []);

  

  // ensures no background loading
  useEffect(() => {
    document.body.style.overflow = isEditModalOpen ? "hidden" : "auto";
  }, [isEditModalOpen]);

  const [columns, setColumns] = useState(3);

  // Calculate columns based on screen size
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1); // Mobile
      else if (width < 1024) setColumns(2); // Tablet
      else setColumns(3); // Desktop
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);


  return (
    <div className="px-2 sm:px-4 py-4">
      {donations.length > 0 ? (
        <div
          // className={`
          //   grid grid-cols-1 
          // ${
          //   columns >= 2 ? "sm:grid-cols-2" : ""
          // } 
          // ${columns >= 3 ? "lg:grid-cols-3" : ""} 
          // gap-3`}
           className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2`}
        >
          {donations.map((donation) => (
            <div
              key={donation.id}
              // className="text-left w-fit h-auto mx-3 px-2"
                className="text-left p-2 w-full h-auto bg-white rounded-md shadow-lg"
            >
              <div className="relative overflow-hidden h-40">
                <img
                  src="/images/download (1).jpeg"
                  alt="donated-img"
                  className="h-full w-full object-cover absolute"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-green-600/10"></div>
               </div>

              <div className="p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                  <h3 className="font-medium text-gray-800 line-clamp-1">
                    {donation.food_type}
                  </h3>

                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    <p>
                      <span className="font-medium">Quantity:</span>{" "}
                      {donation.quantity} kg
                    </p>
                    <p>
                      <span className="font-medium">Expires on:</span>{" "}
                      {new Date(donation.expiry_date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* {donation.food_description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {donation.food_description}
                    </p>
                  )} */}
                </div>

                <div className="mt-4 flex justify-between items-center gap-2">
                    <div className="flex items-center">
                  <button
                    onClick={() => setViewingDonation(donation)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors py-1 whitespace-nowrap"
                  >
                    View Details
                  </button>
                  </div>
                  {/* <div className="flex space-x-3 px-3">
                    <button
                      onClick={() => handleEditClick(donation)}
                      disabled={isSubmitting}
                      className="text-sm px-3 py-1 border border-blue-500 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-md hover:from-blue-600 hover:to-green-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(donation.id)}
                      disabled={isSubmitting}
                      className="text-sm px-3 py-1 border border-red-500 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-green-50 rounded-full flex items-center justify-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            No donations yet
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            You haven't added any donations yet.
          </p>
        </div>
      )}

      {/* View Details Modal */}
      {viewingDonation && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-green-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-lg font-semibold">Donation Details</h2>
              <button
                onClick={() => setViewingDonation(null)}
                className="text-white/80 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <img
                  src="/images/download (1).jpeg"
                  alt="donated-img"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {viewingDonation.food_type}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium">{viewingDonation.quantity} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expiry Date</p>
                    <p className="font-medium">
                      {new Date(
                        viewingDonation.expiry_date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {viewingDonation.food_description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-700 mt-1">
                      {viewingDonation.food_description}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingDonation(null);
                    handleEditClick(viewingDonation);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white text-sm font-medium rounded-md hover:from-blue-600 hover:to-green-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setViewingDonation(null);
                    handleDeleteClick(viewingDonation.id);
                  }}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Donation Modal */}
      {isEditModalOpen && currentDonationToEdit && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-500 to-green-600 p-4 text-white rounded-t-lg">
              <h2 className="text-lg font-semibold">Edit Donation</h2>
            </div>
            <div className="p-4">
              <EditDonation
                initialValues={currentDonationToEdit}
                onSubmit={async (updatedData) => {
                  if (editingDonationId === null) {
                    toast.error("Error: No donation ID found for update.");
                    return { success: false };
                  }

                  const result = await handleDonationAction(
                    editingDonationId,
                    "PUT",
                    updatedData
                  );
                  if (result && typeof result === "object") {
                    setIsEditModalOpen(false);
                    setCurrentDonationToEdit(null);
                  }
                  return {
                    success: !!result,
                    error: result ? undefined : "Update failed",
                  };
                }}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setCurrentDonationToEdit(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
            <div className="bg-gradient-to-r from-blue-500 to-green-600 p-4 text-white rounded-t-lg">
              <h2 className="text-lg font-semibold">Confirm Deletion</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to delete this donation? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors ${
                    isSubmitting
                      ? "bg-red-400"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  }`}
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadedDonations;

