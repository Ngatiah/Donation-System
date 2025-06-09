export async function editDonation(data:any, token: string | null)  {
    try {
      const res = await fetch("http://localhost:8003/FoodBridge/donations/edit-donation/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(data),
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
  