import React from 'react'
import DonationForm from '../UI/forms/DonationForm';
import {donationSchema} from '../lib/validation'
import {postDonations} from '../lib/actions/auth'
import { useAuthStore } from '../../store/authStore';

export default function Donate() {
  const token = useAuthStore(state=>state.token)
  return (
    <DonationForm
    schema={donationSchema}
    defaultValues={{
        food_type:'',
        expiry_date:new Date(),
        available:false,
        quantity :0
    }}
    onSubmit={(formData)=>postDonations(formData,token)}
    />
  )
}
