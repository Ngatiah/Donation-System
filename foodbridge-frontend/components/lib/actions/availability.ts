export async function fetchAvailabilitiesOptions(token:string | null) {
    try {
      const res = await fetch("http://localhost:8003/FoodBridge/donations/availabilities/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
  
      const resData = await res.json();
  
      if (!res.ok) {
        return { success: false, error: resData?.detail || "Fetching the availability options failed failed" };
      }
  
      return { success: true ,data : resData};
    } catch (err) {
      console.error(err);
      return { success: false, error: "An error occurred during availability options fetch" };
    }
    
  }