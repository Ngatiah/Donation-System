import React,{useEffect,useState} from 'react'
import {Flex,Avatar} from '@radix-ui/themes'
import { getInitials } from '../lib/util'
import { useAuthStore } from '../../store/authStore'

interface User{
  id : number;
  role:string;
  name:string;
  email:string;
}

interface DonorProfile {
  
  donor_name: string;
}

interface RecipientProfile {
  recipient_name: string;
}

interface ProfileData {
  donor_profile?: DonorProfile| null ;
  recipient_profile?:  RecipientProfile| null;
  user:User;
  id:number;
  name?: string;
  role?: string;
  email: string;

}

interface UserAvatarProps {
  userId?: number; // optional: if not passed, fetch current user
}


const CustomAvatar : React.FC<UserAvatarProps> = ({userId})=> {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const token = useAuthStore(state => state.token);

    useEffect(() => {
        const fetchProfile = async () => {
          try {
            const endpoint = userId ? `http://localhost:8003/FoodBridge/donations/view-profile/${userId}/` : `http://localhost:8003/FoodBridge/donations/view-profile/`
            const res = await fetch(endpoint, {
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
      }, [token,userId]);

      if (loading) return <div>Loading profile...</div>;
      if (error) return <div>Error: {error}</div>;
      if (!profile) return null;
      const { user} = profile;
      // const {name,role} = user
      const profileName = user?.name
  
  return (
  <Flex gap="2">
	<Avatar
	src="..."
  className=''
	fallback={getInitials(profileName)}
  // fallback={profileName}
  radius='full'
  size='4'
	/>
    </Flex>
  )
}
export default  CustomAvatar;
