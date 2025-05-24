// export async function fetchFoodTypeOptions(token:string | null) {
//     try {
//       const res = await fetch("http://localhost:8003/FoodBridge/donations/donation-options/", {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           // Authorization: `Token ${token}`,
//         },
//       });

//        if (token) {
//         headers["Authorization"] = `Token ${token}`;
//        }
  
//       const resData = await res.json();
  
//       if (!res.ok) {
//         return { success: false, error: resData?.detail || "Fetching the food types options failed failed" };
//       }
  
//       return { success: true ,data : resData};
//     } catch (err) {
//       console.error(err);
//       return { success: false, error: "An error occurred during food type fetching" };
//     }
    
//   }


export async function fetchFoodTypeOptions(token: string | null) {
  try {
    // Declare headers object here, before the fetch call
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Conditionally add the Authorization header
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }

    const res = await fetch("http://localhost:8003/FoodBridge/donations/donation-options/", {
      method: "GET",
      headers: headers,
    });

    const resData = await res.json();

    if (!res.ok) {
      return { success: false, error: resData?.detail || "Fetching the food types options failed" };
    }

    return { success: true, data: resData };
  } catch (err) {
    console.error(err);
    return { success: false, error: "An error occurred during food type fetching" };
  }
}