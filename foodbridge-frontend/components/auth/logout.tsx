import React,{useEffect} from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import {logout as logoutRequest} from '../lib/actions/auth'

const Logout : React.FC = () => {
    const token = useAuthStore(state=> state.token)
    // const token = useAuthStore.getState().token;
    const clearAuth = useAuthStore(state=> state.clearAuth)
    const navigate = useNavigate()

    // useEffect(() => {
    //     const performLogout = async () => {
    //     await logoutRequest(token)
    //     clearAuth()
    //     navigate("/login")
    //     }

    //     performLogout()
    // }, [token,clearAuth,navigate])
    useEffect(() => {
    const performLogout = async () => {
        if (!token) {
            clearAuth();
            navigate("/login");
            return;
        }

        const result = await logoutRequest(token);
        console.log("Logout response:", result);

        clearAuth(); // Always clear auth even if logout fails
        navigate("/login");
    };

    performLogout();
}, [token, clearAuth, navigate]);


  return <p className="text-center mt-10 text-gray-600">Logging you out...</p>
}
export default Logout;
