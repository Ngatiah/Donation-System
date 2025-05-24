
export async function fetchCity(token: string | null) {
  try {
    // Declare headers object here, before the fetch call
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Conditionally add the Authorization header
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }

    const res = await fetch("http://localhost:8003/FoodBridge/donations/cities/", {
      method: "GET",
      headers: headers,
    });

    const resData = await res.json();

    if (!res.ok) {
      return { success: false, error: resData?.detail || "Fetching the cities failed" };
    }

    return { success: true, data: resData };
  } catch (err) {
    console.error(err);
    return { success: false, error: "An error occurred during cities fetching" };
  }
}