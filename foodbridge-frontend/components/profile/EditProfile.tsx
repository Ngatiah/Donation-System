
import React, { useEffect, useState } from "react";
import EditProfileForm from "../UI/forms/EditProfileForm";
import { editProfileSchema } from "../lib/validation";
import { editProfile } from "../lib/actions/profile";
import { useAuthStore } from "../../store/authStore";
import { z } from "zod";

type ProfileFormData = z.infer<typeof editProfileSchema>;

const EditProfile: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [defaultValues, setDefaultValues] = useState<ProfileFormData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Your existing useEffect logic remains exactly the same
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          "http://localhost:8003/FoodBridge/donations/view-profile/",
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        const role = data.role;
        const ownerName = data.name;

        if (!role) {
          throw new Error("Role information missing in profile data");
        }

        const mappedDefaultValues: ProfileFormData = {
          role: role,
          name: ownerName,
          contact_phone:
            (role === "donor" && data.donor_profile?.contact_phone) ||
            (role === "recipient" && data.recipient_profile?.contact_phone) ||
            "",
          ...(role === "recipient" && {
            food_type: data.recipient_profile?.required_food_type ?? [],
            quantity:
              data.recipient_profile?.required_quantity !== undefined &&
              data.recipient_profile?.required_quantity !== null
                ? parseFloat(data.recipient_profile.required_quantity)
                : undefined,
          }),
        };

        setDefaultValues(mappedDefaultValues);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mx-4 my-6">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-green-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Edit Profile</h1>
            <p className="text-blue-100">
              Update your personal information and preferences
            </p>
          </div>

          <div className="p-6">
            {defaultValues ? (
              <EditProfileForm
                schema={editProfileSchema}
                defaultValues={defaultValues}
                onSubmit={(formData) =>
                  editProfile(
                    {
                      ...formData,
                      quantity: formData.quantity || 0,
                    } as Parameters<typeof editProfile>[0],
                    token
                  )
                }
              />
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
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
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">
                  Profile Data Not Available
                </h3>
                <p className="text-gray-500">
                  We couldn't load your profile information. Please try again
                  later.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
