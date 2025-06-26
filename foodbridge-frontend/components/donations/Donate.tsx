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
        // time_range: {
        //   from: "",
        //   until: "",
        //   label: "",
        // },
        food_description: "",
    }}
    onSubmit={(formData) => {
      const cleanData = {
        ...formData,
        expiry_date: formData.expiry_date.toISOString().split("T")[0],
      };
      return postDonations(cleanData, token);
     }}
    />
  )
}
export default Donate;