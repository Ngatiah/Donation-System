import {useAuthStore} from '../../../store/authStore';

export async function signUp({
  name,
  email,
  password,
  role,
  food_type,       
  quantity,
  contact_phone,
  city
} : {
  name: string,
  email:string,
  password:string,
  role:string,
  food_type?:string[],       
  quantity?:number,
  contact_phone:string,
  city : string
}) {
  try {
    const res = await fetch("http://localhost:8003/FoodBridge/donations/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        required_food_type: food_type,
        required_quantity: quantity,    
        contact_phone,
        city
    }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data?.detail || "Signup failed" };
    }

    if (data.token) {
      useAuthStore.getState().setToken(data.token);
    }

    return { 
      success: true,
      // message: data?.message || "Signup successful. Please check your email for verification."
    };
  } catch (err) {
    console.log(err);
    
    return { success: false, error: "An error occurred during sign up" };
  }
}


export async function signInWithCredentials({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const res = await fetch("http://localhost:8003/FoodBridge/donations/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // or use token-based headers
    });

    const data = await res.json();

    if (!res.ok) {
      // return { success: false, error: data?.detail || "Invalid credentials" };
      const errorMessage = data?.detail || (data?.non_field_errors && data.non_field_errors[0]) || "Invalid credentials provided.";
      return { success: false, error: errorMessage };
    }if (typeof data.token !== 'string') {
      return { success: false, error: "Invalid token received" };
    }
    // handling sessions using Knox
    const setToken = useAuthStore.getState().setToken;
    setToken(data.token)

    return { success: true };
  } catch (err) {
    console.log(err);
    
    return { success: false, error: "An error occurred during sign in" };
  }
}


interface ErrorResponse {
  detail?: string;
  [key: string]: any;  // allow other props too
}

export async function logout(token: string | null) {
  try {
    const res = await fetch("http://localhost:8003/FoodBridge/donations/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

    let resData: ErrorResponse | null = null;
    const text = await res.text();

    if (text) {
      try {
        resData = JSON.parse(text);
      } catch {
        // ignore parse errors
      }
    }

    if (!res.ok) {
      // Check if resData is an object and has 'detail' property
      if (resData && typeof resData === "object" && "detail" in resData) {
        return { success: false, error: resData.detail };
      }
      return { success: false, error: `Logout failed with status ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "An error occurred during logout" };
  }
}

