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
        const profileData = role == 'donor' ? data.donor_profile : data.recipient_profile;
        const ownerName = role == 'donor' ? data.donor_profile.donor_name : data.recipient_profile.recipient_name

        if (!profileData || !role) {
          console.error("Profile data or role missing:", data);
          return;
        }


        // Map backend fields to form fields
        const mappedDefaultValues: ProfileFormData = {
          role: role,
          name: ownerName,
          contact_phone: profileData.contact_phone || '',
          ...(role === 'recipient' && {
            food_type: profileData.required_food_type ?? [],
            // Convert string to float for input
            quantity: profileData.required_quantity !== undefined ? parseFloat(profileData.required_quantity) : undefined, 

          }),
        };
        console.log("Quantity from backend:", profileData.required_quantity, typeof profileData.required_quantity);
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
      onSubmit={(formData) => editProfile({...formData}, token)}
    />
  ) : (
    <div>Loading profile...</div>
  );
};

export default EditProfile;
