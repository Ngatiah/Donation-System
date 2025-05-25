// import React from 'react';
import React,{useState,useEffect} from 'react';
import CustomAvatar from '../UI/Avatar'
import {ChevronDown,Plus} from 'lucide-react'
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {DropdownMenu,DropdownMenuItem,DropdownMenuContent,DropdownMenuTrigger} from '../UI/DropdownMenu'
import NotificationBell from '../notifications/NotificationBell'
interface User{
    name : string;
    role : string;
    email:string;
}

interface TopUser {
    name: string;
    total_quantity_kg: number;
}

interface Profile{
    user: User;
    role:string;
    required_food_type?:string;
    required_quantity?: number;
}

interface DonationMatch{
  id:number;
    donor_name : string;
    recipient_name:string;
    food_type:string;
    matched_quantity:string,
    food_description:string;
}

interface Donation {
    food_type: string;
    quantity: number;
    expiry_date: string;
    food_description?: string;
}

interface DashboardData{
    profile : Profile;
    matches : DonationMatch[];
    donations : Donation[];
    topUsers: TopUser[];
}

const Dashboard : React.FC = () => {

    const [dashData, setDashData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [noMatchesMessage, setNoMatchesMessage] = useState<string | null>(null);
    const token = useAuthStore(state => state.token);

  useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setError(null);
      setNoMatchesMessage(null);
      setLoading(true); 
      const res = await fetch("http://localhost:8003/FoodBridge/donations/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      const profileData = await res.json();
      console.log("Fetched profileData:", profileData);

      if (!res.ok) {
        setError(profileData?.detail || "Failed to fetch profile and donation matches data");
        return;
      }

      let donationData: Donation[] = [];
      let matchData: DonationMatch[] = [];
      let topUsersData: TopUser[] = [];

      if (profileData?.profile?.role === 'donor') {
        const donorRes = await fetch("http://localhost:8003/FoodBridge/donations/create-donations/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

        const donorDonations = await donorRes.json();
        if (!donorRes.ok) throw new Error(donorDonations?.detail || "Failed to fetch donations");
        donationData = donorDonations;
      } else if (profileData?.profile?.role === 'recipient') {
        const recipientProfile = profileData.profile; // Get recipient profile
        if (!recipientProfile) {
            throw new Error("Recipient profile not available for matching.");
        }

        // console.log("Recipient Profile received:", recipientProfile); // ADD THIS LINE
        // console.log("Required Food Type:", recipientProfile.required_food_type); // ADD THIS LINE
        // console.log("Required Quantity:", recipientProfile.required_quantity); // ADD THIS LINE

         // Ensure required_quantity is treated as a number
            const quantityToSend = typeof recipientProfile.required_quantity === 'string'
            ? parseFloat(recipientProfile.required_quantity)
            : recipientProfile.required_quantity;

        const matchRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-matches/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            recipient_food_type: recipientProfile.required_food_type,
            required_quantity: quantityToSend,
        }),
        });

        const recipientMatches = await matchRes.json();
        // if (!matchRes.ok) throw new Error(recipientMatches?.detail || "Failed to fetch matches");
        if (!matchRes.ok) {
            if (matchRes.status === 404 && recipientMatches?.message) {
                setNoMatchesMessage(recipientMatches.message);
                matchData = []; 
            } else if (matchRes.status === 204 && recipientMatches?.message) {
                setNoMatchesMessage(recipientMatches.message);
                matchData = [];
            }
            else {
                // For other errors, set the general error state
                setError(recipientMatches?.detail || "Failed to fetch matches");
                matchData = [];
            }
        } else {
            // If response is OK, set matches data
            // matchData = recipientMatches.matches;
            const uniqueMatches = Array.from(
                new Map(recipientMatches.matches.map((item :DonationMatch)  =>
                    [item.food_type + item.donor_name + item.food_description, item]
                )).values()
            );
            matchData = uniqueMatches;
        }
      }

        // --- FETCH TOP USERS DATA ---
                const topUsersRes = await fetch("http://localhost:8003/FoodBridge/donations/top-users/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                });

                const topUsersJson = await topUsersRes.json();
                if (!topUsersRes.ok) {
                    console.error("Failed to fetch top users:", topUsersJson?.error || topUsersJson?.detail);
                    // Optionally set an error specifically for top users, or just skip
                } else {
                    // Decide which list to use based on the logged-in user's role
                    if (profileData?.profile?.role === 'donor' && topUsersJson.top_recipients) {
                        topUsersData = topUsersJson.top_recipients;
                    } else if (profileData?.profile?.role === 'recipient' && topUsersJson.top_donors) {
                        topUsersData = topUsersJson.top_donors;
                    }
                }

      setDashData({ ...profileData, donations: donationData, matches: matchData,topUsers: topUsersData });

    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("An error occurred while fetching profile");
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, [token]);

       if (loading) return <div className="animate-pulse text-gray-500">Loading dashboard...</div>
     if (error) return <div>Error: {error}</div>;
     if (!dashData) return null;
     
     const { profile,matches ,donations,topUsers} = dashData;
     if (!profile?.role) {
        return <div>Error: User role not found in profile data</div>;
      }
     const role = profile.role.toLowerCase();
     console.log("role",role);

     

  return (
    <main className="flex-1 p-6 overflow-auto">
        {/* <!-- Navbar --> */}
        <div className="flex items-center w-full justify-end">
            
            <div className="flex items-center space-x-4 ml-4">
            <Link to="/donate">
              {role === 'donor' && <button className="bg-blue-600 text-white px-4 py-2 rounded">New Donation<span className="ml-2 items-center flex"><Plus className='h-8 w-8'/></span>
              </button>}
            </Link>

            <NotificationBell/>

              {/* <!-- Avatar Dropdown --> */}
              <div className="relative group flex flex-cols">
                <CustomAvatar/>
                {/* <span className="font-semibold text-gray-800 hidden md:inline">{profile.user.name}</span> */}
                <DropdownMenu >
                    <DropdownMenuTrigger>
                            <ChevronDown className='h-8 w-8 px-1'/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>
                            Recipient
                            {/* {name} */}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
              </div>
            </div>
          </div>

      {/* Main Content */}
      {/* <!-- Donations --> */}
      <section className="mb-8">
          <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">{role === 'donor' ? 'Your Donations' : 'Available Donations'}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
             
              {/* render donations based on role */}
            <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
            {/*  uploaded donations by donor */}
            {role === 'donor' && donations?.map((donation, i) => (
            <div key={i} className="bg-white p-4 rounded shadow text-left">
                <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                <h3 className="font-semibold">{donation.food_type}</h3>
                <div className="text-sm">Quantity: <strong>{donation.quantity}</strong></div>
                <div className="text-sm">Expires: <strong>{new Date(donation.expiry_date).toLocaleDateString()}</strong></div>
                <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
            </div>
            ))}
               
            {/* matched donations for recipient  */}
          {role === 'recipient' && (
              <>
                {matches?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 col-span-3"> 
                    {matches.map((match, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl shadow-lg text-left">
                        {/* <img src="/images/food-placeholder.jpg" alt={`${match.food_type} image`} className="rounded-md mb-3 w-full h-40 object-cover" /> */}
                        <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
                        <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
                        <p className="text-sm text-gray-600">Donor: <span className="font-medium">{match.donor_name}</span></p>
                        <p className="text-sm text-gray-700">Quantity: {match.matched_quantity}</p>
                        <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Display message when no matches are found
                  <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700">
                    <p className="text-lg font-medium">
                        {noMatchesMessage || "No available donations found matching your criteria at this time. Please check back later or update your required food type."}
                    </p>
                    {/* Optional: Add a link to update profile if needed */}
                    {/* <Link to="/profile-settings" className="text-blue-600 hover:underline mt-4 inline-block">Update Profile</Link> */}
                  </div>
                )}
              </>
            )}

            </div>

               {/* Top Users list based on role */}
              <div className="p-4 col-span-1">                              
              <h3 className="font-semibold mb-2">
              {role === 'donor' ? 'Top Recipients' : 'Top Donors'}                </h3>
              <ul className="space-y-2">
                 {topUsers.length > 0 ? (
                                topUsers.map((user, i) => (
                                    <li key={i} className="flex justify-between items-center p-4 rounded border border-gray-200">
                                        <CustomAvatar />
                                        <span className='text-base p-2'>{user.name}</span>
                                        <span className='text-base p-2'>{user.total_quantity_kg}kg</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-gray-500 text-center">No top {role === 'donor' ? 'recipients' : 'donors'} data available.</li>
                            )}
              </ul>
              </div>
              
          </div>
      </section>

      {/* <!-- Statistics and Donors --> */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* <!-- Statistics Chart --> */}
          <div className="bg-white p-4 rounded shadow col-span-2">
              <h3 className="font-semibold mb-2">Statistics</h3>
              <div className="h-48 bg-gray-200 flex items-center justify-center">[Chart Placeholder]</div>
        
          </div>

          {/* total donations with their statuses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1">
          <div className="bg-white p-4 rounded shadow text-left">
                  {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
              <div className="bg-white p-4 rounded shadow text-left">
                  {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
              <div className="bg-white p-4 rounded shadow text-left">
                  {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
              <div className="bg-white p-4 rounded shadow text-left">
                  {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
                  <h3 className="font-semibold">Maize</h3>
                  <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
                  <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
              </div>
              
          </div>
      </section>

      {/* <!-- Summary --> */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded shadow text-center">
              <h4 className="text-sm text-gray-500">Total Donation</h4>
              <p className="text-lg font-bold">$1,214,501</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
              <h4 className="text-sm text-gray-500">Donation Today</h4>
              <p className="text-lg font-bold">$7,925</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
              <h4 className="text-sm text-gray-500">Total Donor</h4>
              <p className="text-lg font-bold">2,581</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
              <h4 className="text-sm text-gray-500">Average Donation</h4>
              <p className="text-lg font-bold">$285.56</p>
          </div>
      </section>
 
    </main>
  );
};

export default Dashboard;
