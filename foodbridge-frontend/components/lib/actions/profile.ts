export async function editProfile({
    name,
    contact_phone,
    food_type,
    quantity,
    role,
  } : {
    name : string,
    contact_phone : string,
    food_type?: string[],
    quantity : number,
    role : "donor" | 'recipient',
  }, token: string | null)  {
    try {
      const payload =
        role === "donor"
          ? {
              donor_profile: {
                name,
                contact_phone,
              },
            }
          : {
              recipient_profile: {
                name,
                contact_phone,
                food_type,
                quantity,
              },
            };
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
  