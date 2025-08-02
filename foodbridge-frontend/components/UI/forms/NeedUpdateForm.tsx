// import { useState} from 'react';
// import { useAuthStore } from '../../../store/authStore';
// import { FIELD_NAMES, FIELD_TYPES } from "../../constants";
// import { Button } from '../Button';
// import { zodResolver } from '@hookform/resolvers/zod';
// import type {
//   DefaultValues,
//   FieldValues,
//   Path,
//   SubmitHandler,
//   UseFormReturn,
//   useForm
// } from "react-hook-form";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "../Form";
// import { Input } from '../Input';
// import { useNavigate } from 'react-router-dom';
// import { ZodType } from 'zod';


// interface Props<T extends FieldValues> {
//   schema: ZodType<T>;
//   defaultValues: T;
//   onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
// }


// export default function UpdateNeedsForm<T extends FieldValues>({
//   schema,
//   defaultValues,
//   onSubmit,
// }: Props<T>) {
//   const token = useAuthStore(state => state.token)
//   const form: UseFormReturn<T> = useForm<T>({
//       resolver: zodResolver(schema),
//       defaultValues: defaultValues as DefaultValues<T>,
//     });
  
//   const navigate = useNavigate();
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');


//   const handleSubmit: SubmitHandler<T> = async (data) => {
//   setError('');
//   setMessage('');

//   try {
//     const response = await fetch('http://localhost:8003/FoodBridge/recipient-need-update/', {
//       method: 'PATCH',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Token ${token}`,
//       },
//       body: JSON.stringify(data),
//     });

//     if (response.ok) {
//       setMessage('Your food needs were updated successfully.');
//       navigate('/view-profile')
//     } else {
//       const json = await response.json();
//       setError(json.detail || 'Update failed. You may need to wait 30 days.');
//       navigate('/view-profile')
//     }
//   } catch {
//     setError('An error occurred during update.');
//   }
// };



//   const needUpdateFormFields = [
//     "food_type",
//     "quantity",
//   ] as const;

//   const needUpdateFieldTypes = needUpdateFormFields.reduce((acc, field) => {
//       acc[field] = FIELD_TYPES[field];
//       return acc;
//     }, {} as Record<(typeof needUpdateFormFields)[number], string>);
  
//     const needUpdateFieldNames = needUpdateFormFields.reduce((acc, field) => {
//       acc[field] = FIELD_NAMES[field];
//       return acc;
//     }, {} as Record<(typeof needUpdateFormFields)[number], string>);

//   return (
//     <div className="max-w-md mx-auto p-4 bg-white rounded-xl shadow">
//       <h2 className="text-xl font-semibold mb-4">Update Your Food Needs</h2>

//       {message && <p className="text-green-600 mb-3">{message}</p>}
//       {error && <p className="text-red-500 mb-3">{error}</p>}

//       <Form {...form}>
//             <form
//               onSubmit={form.handleSubmit(handleSubmit)}
//               className="space-y-4"
//             >
//               {needUpdateFormFields.map((fieldName) => (
//               <FormField
//                 key={fieldName}
//                 control={form.control}
//                 name={fieldName as Path<T>}
//                 render={({ field }) => (
//                   <FormItem> 
//                     <FormLabel className="block text-sm font-medium text-gray-700 mb-1">
//                       {needUpdateFieldNames[
//                         fieldName as keyof typeof needUpdateFieldNames
//                       ]}
//                     </FormLabel>

//                     <FormControl>
//                         <Input
//                           {...field}
//                           required={needUpdateFormFields.includes(fieldName)}
//                           type={
//                             needUpdateFieldTypes[
//                               fieldName as keyof typeof needUpdateFieldTypes
//                             ]}
//                           // value={field.value as string | number}
//                           // onChange={handleChange}
//                           // className="w-full"
//                           className="form-input"
//                         />
//                     </FormControl>

//                     <FormMessage className="text-red-500 text-xs mt-1" />
//                   </FormItem>
//                 )}
//               />
//             ))}

//             <div className="pt-6">
//                         <Button
//                           type="submit"
//                           className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium rounded-md shadow-sm transition-colors"
//                         >
//                           Update Profile
//                         </Button>
//                       </div>
             
//             </form>
//         {/* <button
//           type="submit"
//           className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
//         >
//           Update Needs
//         </button> */}
//           </Form>

//     </div>
//   );
// }
