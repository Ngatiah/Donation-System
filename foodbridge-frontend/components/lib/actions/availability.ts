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
  
      // if (!res.ok) {
      //   return { success: false, error: resData?.detail || "Fetching the availability options failed failed" };
      // }
      if (res.ok) {
        const formattedOptions = resData.map((item: { day_of_week: string }) => ({
          label: item.day_of_week.charAt(0).toUpperCase() + item.day_of_week.slice(1),
          value: item.day_of_week,
        }));
  
        return { success: true, data: formattedOptions };
      } else {
        return { success: false, error: resData?.detail || "Fetching the availabile days of the week failed" };
      }
      } catch (err) {
      console.error(err);
      return { success: false, error: "An error occurred during availability options fetch" };
    }
    
  }