import React, { useEffect, useState } from 'react';
import EditProfileForm from '../UI/forms/EditProfileForm';
import { editProfileSchema } from '../lib/validation';
import { editProfile } from '../lib/actions/profile';
import { useAuthStore } from '../../store/authStore';
import {z} from 'zod';
type ProfileFormData = z.infer<typeof editProfileSchema>;

const EditProfile: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [defaultValues, setDefaultValues] = useState<ProfileFormData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8003/FoodBridge/donations/view-profile/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        const data = await res.json();

        // const role = data.donor_profile ? 'donor' : (data.recipient_profile ? 'recipient' : ''); 
        // const profileData = data.donor_profile || data.recipient_profile;
        // const ownerName = data.name;
        const role = data.role
        // const profileData = role == 'donor' ? data.donor_profile : data.recipient_profile;
        // const ownerName = role == 'donor' ? data.donor_profile.donor_name : data.recipient_profile.recipient_name
        const ownerName = data.name

        if (!role) {
          console.error("role missing:", data);
          return;
        }


        // Map backend fields to form fields
        const mappedDefaultValues: ProfileFormData = {
          role: role,
          name: ownerName,
          contact_phone: (role === 'donor' && data.donor_profile?.contact_phone) ||
          (role === 'recipient' && data.recipient_profile?.contact_phone) || '',
        ...(role === 'recipient' && {
          food_type: data.recipient_profile?.required_food_type ?? [], // Access directly
          // quantity: data.recipient_profile?.required_quantity !== undefined ? parseFloat(data.recipient_profile.required_quantity) : undefined,
          quantity: data.recipient_profile?.required_quantity !== undefined && data.recipient_profile?.required_quantity !== null
                                  ? parseFloat(data.recipient_profile.required_quantity)
                                  : undefined,
        }),
        // city: (role === 'donor' && data.donor_profile?.city) ||
        //       (role === 'recipient' && data.recipient_profile?.city) || '',
        };
        // console.log("Quantity from backend:", profileData.required_quantity, typeof profileData.required_quantity);
        setDefaultValues(mappedDefaultValues);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        // Handle error, maybe set an error state or show a toast
      }
    };

    if (token) { // Only fetch if token exists
      fetchProfile();
    }
  }, [token]);

  return defaultValues ? (
    <EditProfileForm
      schema={editProfileSchema}
      defaultValues={defaultValues}
     onSubmit={(formData) => editProfile(
                {
                    ...formData,
                    // Type assertion here:
                    // If formData.quantity is undefined, assign 0 or handle as per your backend's expectation for missing quantity
                    quantity: formData.quantity || 0, // This is a common way to convert undefined to 0 if it must be a number
                    // Or if it truly can be undefined in the backend, use Option 1
                } as Parameters<typeof editProfile>[0] // Assert the whole object
                , token)
            }
    />
  ) : (
    <div>Loading profile...</div>
  );
};

export default EditProfile;
