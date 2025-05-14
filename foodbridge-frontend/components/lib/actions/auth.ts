import {useAuthStore} from '../../../store/authStore';

export async function signUp({
  name,
  email,
  password,
  role,
  food_type,       
  quantity,
  contact_phone
} : {
  name: string,
  email:string,
  password:string,
  role:string,
  food_type?:string,       
  quantity?:number,
  contact_phone:string 
}) {
  try {
    const res = await fetch("http://localhost:8003/FoodBridge/donations/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({name,email,password,role,food_type,quantity,contact_phone}),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data?.detail || "Signup failed" };
    }

    return { success: true };
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
      return { success: false, error: data?.detail || "Invalid credentials" };
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

export async function logout(token:string | null) {
  try {
    const res = await fetch("http://localhost:8003/FoodBridge/donations/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

    const resData = await res.json();

    if (!res.ok) {
      return { success: false, error: resData?.detail || "Logout failed" };
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "An error occurred during logout" };
  }
  
}
