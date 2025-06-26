// import React, { useEffect, useState } from "react";
// import EditProfileForm from "../UI/forms/EditProfileForm";
// import { editProfileSchema } from "../lib/validation";
// import { editProfile } from "../lib/actions/profile";
// import { useAuthStore } from "../../store/authStore";
// import { z } from "zod";
// type ProfileFormData = z.infer<typeof editProfileSchema>;

// const EditProfile: React.FC = () => {
//   const token = useAuthStore((state) => state.token);
//   const [defaultValues, setDefaultValues] = useState<ProfileFormData | null>(
//     null
//   );

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await fetch(
//           "http://localhost:8003/FoodBridge/donations/view-profile/",
//           {
//             headers: {
//               Authorization: `Token ${token}`,
//             },
//           }
//         );
//         const data = await res.json();

//         // const role = data.donor_profile ? 'donor' : (data.recipient_profile ? 'recipient' : '');
//         // const profileData = data.donor_profile || data.recipient_profile;
//         // const ownerName = data.name;
//         const role = data.role;
//         const profileData =
//           role == "donor" ? data.donor_profile : data.recipient_profile;
//         const ownerName =
//           role == "donor"
//             ? data.donor_profile.donor_name
//             : data.recipient_profile.recipient_name;

//         if (!profileData || !role) {
//           console.error("Profile data or role missing:", data);
//           return;
//         }

//         // Map backend fields to form fields
//         const mappedDefaultValues: ProfileFormData = {
//           role: role,
//           name: ownerName,
//           contact_phone: profileData.contact_phone || "",
//           ...(role === "recipient" && {
//             food_type: profileData.required_food_type ?? [],
//             // Convert string to float for input
//             quantity:
//               profileData.required_quantity !== undefined
//                 ? parseFloat(profileData.required_quantity)
//                 : undefined,
//           }),
//         };
//         console.log(
//           "Quantity from backend:",
//           profileData.required_quantity,
//           typeof profileData.required_quantity
//         );
//         setDefaultValues(mappedDefaultValues);
//       } catch (error) {
//         console.error("Failed to fetch profile:", error);
//         // Handle error, maybe set an error state or show a toast
//       }
//     };

//     if (token) {
//       // Only fetch if token exists
//       fetchProfile();
//     }
//   }, [token]);

//   return defaultValues ? (
//     <EditProfileForm
//       schema={editProfileSchema}
//       defaultValues={defaultValues}
//       onSubmit={(formData) => editProfile({ ...formData }, token)}
//     />
//   ) : (
//     <div>Loading profile...</div>
//   );
// };

// export default EditProfile;
import React, { useEffect, useState } from "react";
import EditProfileForm from "../UI/forms/EditProfileForm";
import { editProfileSchema } from "../lib/validation";
import { editProfile } from "../lib/actions/profile";
import { useAuthStore } from "../../store/authStore";
import { z } from "zod";
import { FiLoader } from "react-icons/fi";
import { FaUserEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

type ProfileFormData = z.infer<typeof editProfileSchema>;

const EditProfile: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [defaultValues, setDefaultValues] = useState<ProfileFormData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Your existing useEffect logic remains exactly the same
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          "http://localhost:8003/FoodBridge/donations/view-profile/",
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
        const data = await res.json();

        const role = data.role;
        const profileData =
          role == "donor" ? data.donor_profile : data.recipient_profile;
        const ownerName =
          role == "donor"
            ? data.donor_profile.donor_name
            : data.recipient_profile.recipient_name;

        if (!profileData || !role) {
          console.error("Profile data or role missing:", data);
          setError("Profile data incomplete");
          return;
        }

        const mappedDefaultValues: ProfileFormData = {
          role: role,
          name: ownerName,
          contact_phone:
            (role === "donor" && data.donor_profile?.contact_phone) ||
            (role === "recipient" && data.recipient_profile?.contact_phone) ||
            "",
          ...(role === "recipient" && {
            food_type: data.recipient_profile?.required_food_type ?? [], // Access directly
            // quantity: data.recipient_profile?.required_quantity !== undefined ? parseFloat(data.recipient_profile.required_quantity) : undefined,
            quantity:
              data.recipient_profile?.required_quantity !== undefined &&
              data.recipient_profile?.required_quantity !== null
                ? parseFloat(data.recipient_profile.required_quantity)
                : undefined,
          }),
          // city: (role === 'donor' && data.donor_profile?.city) ||
          //       (role === 'recipient' && data.recipient_profile?.city) || '',
        };
        // console.log("Quantity from backend:", profileData.required_quantity, typeof profileData.required_quantity);
        setDefaultValues(mappedDefaultValues);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleSubmit = async (formData: ProfileFormData) => {
    try {
      await editProfile(formData, token);
      navigate("/view-profile"); // Navigate back on success
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // Loading and error states remain the same...
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-blue-100 max-w-md w-full mx-4">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-pulse rounded-full bg-blue-100 p-4">
              <FaUserEdit className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Profile
          </h3>
          <p className="text-gray-600 mb-4">Gathering your information...</p>
          <FiLoader className="animate-spin h-6 w-6 text-blue-500 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg border border-red-100">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Profile
            </h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return defaultValues ? (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4">
            <div className="flex items-center">
              <FaUserEdit className="h-6 w-6 text-white mr-2" />
              <h2 className="text-xl font-semibold text-white">
                {defaultValues?.role === "donor"
                  ? "Edit Donor Profile"
                  : "Edit Recipient Profile"}
              </h2>
            </div>
          </div>

          <EditProfileForm
            schema={editProfileSchema}
            defaultValues={defaultValues}
            onSubmit={(formData) =>
              editProfile(
                {
                  ...formData,
                  // Type assertion here:
                  // If formData.quantity is undefined, assign 0 or handle as per your backend's expectation for missing quantity
                  quantity: formData.quantity || 0, // This is a common way to convert undefined to 0 if it must be a number
                  // Or if it truly can be undefined in the backend, use Option 1
                } as Parameters<typeof editProfile>[0], // Assert the whole object
                token
              )
            }
          />
        </div>
      </div>
    </div>
  ) : (
    <div>Loading profile...</div>
  );
};

export default EditProfile;
