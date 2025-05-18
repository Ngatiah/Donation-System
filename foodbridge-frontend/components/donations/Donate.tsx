import React from 'react'
import DonationForm from '../UI/forms/DonationForm';
import {postDonations} from '../lib/actions/donations'
import { useAuthStore } from '../../store/authStore';
import { donationSchema } from '../lib/validation';

const Donate : React.FC = ()=> {
  const token = useAuthStore(state=>state.token)
  console.log("Donation Schema:", donationSchema); 
  return (
    <DonationForm
    schema={donationSchema}
    defaultValues={{
        food_type: "",
        quantity: 0,
        expiry_date: new Date(),
        time_range: {
          from: "",
          until: "",
          label: "",
        },
        food_description: "",
    }}
    onSubmit={(formData)=>postDonations(formData,token)}
    />
  )
}
export default Donate;