export async function fetchTimeRangeOptions(token:string | null) {
    // if(!token) return //wait for token
    try {
      const res = await fetch("http://localhost:8003/FoodBridge/donations/time-range-options/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
  
      const resData = await res.json();
  
      if (!res.ok) {
        return { success: false, error: resData?.detail || "Fetching the time range options failed failed" };
      }
  
      return { success: true ,data : resData};
    } catch (err) {
      console.error(err);
      return { success: false, error: "An error occurred during time range options fetch" };
    }
    
  }