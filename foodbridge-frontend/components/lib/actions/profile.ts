// export async function editProfile({
//     name,
//     contact_phone,
//     food_type,
//     quantity,
//     role,
//   } : {
//     name : string,
//     contact_phone : string,
//     food_type?: string[],
//     quantity : number,
//     role : "donor" | 'recipient',
//   }, token: string | null)  {
//     try {
//       const payload =
//         role === "donor"
//           ? {
//               donor_profile: {
//                 name,
//                 contact_phone,
//               },
//             }
//           : {
//               recipient_profile: {
//                 name,
//                 contact_phone,
//                 food_type,
//                 quantity,
//               },
//             };
//       const res = await fetch("http://localhost:8003/FoodBridge/donations/edit-profile/", {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Token ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });
  
//       const resData = await res.json();
  
//       if (!res.ok) {
//         return { success: false, error: resData?.detail || "Profile update failed" };
//       }
  
//       return { success: true };
//     } catch (err) {
//       console.error(err);
//       return { success: false, error: "An error occurred during profile update" };
//     }
//   }
  

export async function editProfile({
    name,
    contact_phone,
    food_type, // This will be `required_food_type` for the backend
    quantity,  // This will be `required_quantity` for the backend
    role,
  }: {
    name: string;
    contact_phone: string;
    food_type?: string[]; // Renamed to `required_food_type` in payload
    quantity?: number;     // Renamed to `required_quantity` in payload
    role: "donor" | 'recipient';
  }, token: string | null) {
    try {
      const payload: any = {
        name: name, // User's name is top-level
      };

      if (role === "donor") {
        payload.donor_profile = {
          contact_phone: contact_phone,
        };
      } else if (role === "recipient") { 
        payload.recipient_profile = {
          contact_phone: contact_phone,
          // IMPORTANT: Backend RecipientSerializer expects 'required_food_type' and 'required_quantity'
          required_food_type: food_type, 
          // required_quantity: quantity, 
           ...(quantity !== undefined && quantity !== null && { required_quantity: quantity }),  
        };
      }

      const res = await fetch("http://localhost:8003/FoodBridge/donations/edit-profile/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        return { success: false, error: resData?.detail || "Profile update failed" };
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "An error occurred during profile update" };
    }
}