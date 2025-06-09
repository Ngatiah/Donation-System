export async function postDonations(data: any, token: string | null) {
    try {
      const res = await fetch("http://localhost:8003/FoodBridge/donations/create-donations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(data),
      });
  
      const resData = await res.json();
  
      if (!res.ok) {
        return { success: false, error: resData?.detail || "Donation failed" };
      }
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "An error occurred during donation" };
    }
  }


// get single donation
export async function getDonationById(id: string, token: string | null) {
  try {
    const res = await fetch(`http://localhost:8003/FoodBridge/update-donations/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

    const resData = await res.json();

    if (!res.ok) {
      // If the response is not OK (e.g., 404, 500), return an error
      return { success: false, error: resData?.detail || "Failed to fetch donation" };
    }
    // If successful, return success and the fetched data
    return { success: true, data: resData };
  } catch (err) {
    console.error("Error fetching donation:", err);
    return { success: false, error: "An error occurred while fetching the donation" };
  }
}

// updating existing donation
export async function putDonation(id: string, data: any, token: string | null) {
  try {
    const res = await fetch(`http://localhost:8003/FoodBridge/update-donations/${id}/`, {
      method: "PUT", // Use PUT for full updates, PATCH for partial updates
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(data),
    });

    const resData = await res.json(); // Even on success, API might return updated object

    if (!res.ok) {
      // If the response is not OK, return an error
      return { success: false, error: resData?.detail || "Donation update failed" };
    }
    // If successful, you might want to return the updated data if your API sends it back
    return { success: true, data: resData };
  } catch (err) {
    console.error("Error updating donation:", err);
    return { success: false, error: "An error occurred during donation update" };
  }
}


export async function deleteDonation(id: string, token: string | null) {
  try {
    const res = await fetch(`http://localhost:8003/FoodBridge/donations/update-donations/${id}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

    if (!res.ok) {
      const resData = await res.json();
      return { success: false, error: resData?.detail || "Donation deletion failed" };
    }
    return { success: true }; // No data returned on successful delete
  } catch (err) {
    console.error("Error deleting donation:", err);
    return { success: false, error: "An error occurred during donation deletion" };
  }
}