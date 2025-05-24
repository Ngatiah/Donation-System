// import React from 'react'
// import EditProfileForm from '../UI/forms/EditProfileForm'
// import {editProfileSchema} from '../lib/validation'
// import { editProfile } from '../lib/actions/auth'
// import { useAuthStore } from '../../store/authStore'

// const EditProfile : React.FC = ()=> {
//   const token = useAuthStore(state=>state.token)

//   return (
//     <EditProfileForm
//     schema={editProfileSchema}
//     defaultValues={{
//       name:'',
//       contact_phone:'',
//       food_type:'',
//       quantity:0,
//       role: 'donor',
//       available:false,
//     }}
//     onSubmit={(formData)=> editProfile({...formData},token)}/>
//   )
// }
// export default EditProfile;



import React, { useEffect, useState } from 'react';
import EditProfileForm from '../UI/forms/EditProfileForm';
import { editProfileSchema } from '../lib/validation';
import { editProfile } from '../lib/actions/profile';
import { useAuthStore } from '../../store/authStore';
import {z} from 'zod'

type ProfileFormData = z.infer<typeof editProfileSchema>;

const EditProfile: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  // const token = useAuthStore.getState().token;
  const [defaultValues, setDefaultValues] = useState<ProfileFormData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("http://localhost:8003/FoodBridge/donations/view-profile/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      const data = await res.json();

      const role = data.donor_profile ? 'donor' : 'recipient';
      const profileData = data.donor_profile || data.recipient_profile;

      setDefaultValues({
        ...profileData,
        role,
      });
    };

    fetchProfile();
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
