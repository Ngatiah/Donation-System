import React,{useEffect,useState} from 'react'
import {Flex,Avatar} from '@radix-ui/themes'
import { getInitials } from '../lib/util'
import { useAuthStore } from '../../store/authStore'

interface User{
  id: number;
  name: string;
  email: string;
  role: string;

}
interface ProfileData {
  user: User;
}

const CustomAvatar : React.FC = ()=> {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const token = useAuthStore(state => state.token);

    useEffect(() => {
        const fetchProfile = async () => {
          try {
            const res = await fetch("http://localhost:8003/FoodBridge/donations/view-profile/", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
              },
            });
    
            const data = await res.json();
    
            if (!res.ok) {
              setError(data?.detail || "Failed to fetch profile");
              return;
            }
    
            setProfile(data);
          } catch (err) {
            console.error("Profile fetch error:", err);
            setError("An error occurred while fetching profile");
          } finally {
            setLoading(false);
          }
        };
    
        fetchProfile();
      }, [token]);

      if (loading) return <div>Loading profile...</div>;
      if (error) return <div>Error: {error}</div>;
      if (!profile) return null;
      const { user} = profile;
      const { name} = user;
  
  return (
  <Flex gap="2">
	<Avatar
	src="..."
  className=''
	fallback={getInitials(name)}
  radius='full'
  size='5'
	/>
    </Flex>
  )
}
export default  CustomAvatar;
