import React from 'react'
import DonationForm from '../UI/forms/DonationForm';
import {postDonations} from '../lib/actions/donations'
import { useAuthStore } from '../../store/authStore';
import { donationSchema } from '../lib/validation';

const Donate : React.FC = ()=> {
  const token = useAuthStore.getState().token;
  return (
    <DonationForm
    type='DONATION'
    schema={donationSchema}
    defaultValues={{
        food_type: '',
        quantity: 0,
        expiry_date: new Date(),
        // image :'',
        image:'/images/download (1).jpeg',
        // time_range: {
        //   from: "",
        //   until: "",
        //   label: "",
        // },
        food_description: "",
    }}
    // onSubmit={(formData) => {
    //   const cleanData = {
    //     ...formData,
    //     expiry_date: formData.expiry_date.toISOString().split("T")[0],
    //   };
    //   return postDonations(cleanData, token);
    //   // return postDonations(formData, token);

    //  }}
    onSubmit={async (formData) => {
        const formDataToSend = new FormData();
        formDataToSend.append("food_type", formData.food_type);
        formDataToSend.append("quantity", String(formData.quantity));
        formDataToSend.append("expiry_date", formData.expiry_date.toISOString().split("T")[0]);
        formDataToSend.append("food_description", formData.food_description || "");

        // For static image URL
        if (typeof formData.image === "string") {
          const imageUrl = formData.image.startsWith("/")
            ? `${window.location.origin}${formData.image}`
            : formData.image;
          formDataToSend.append("image_url", imageUrl);
        }

        return postDonations(formDataToSend, token);
      }}

    />
  )
}
export default Donate;