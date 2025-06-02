// import React,{useState,useEffect} from 'react';
// import CustomAvatar from '../UI/Avatar'
// import {ChevronDown,Plus} from 'lucide-react'
// import { Link } from 'react-router-dom';
// import { useAuthStore } from '../../store/authStore';
// import toast from 'react-hot-toast';
// import {DropdownMenu,DropdownMenuItem,DropdownMenuContent,DropdownMenuTrigger} from '../UI/DropdownMenu'
// import NotificationBell from '../notifications/NotificationBell'
// interface User{
//     name : string;
//     role : string;
//     email:string;
// }

// interface TopUser {
//     name: string;
//     total_quantity_kg: number;
// }

// interface Profile{
//     user: User;
//     role:string;
//     required_food_type?:string;
//     required_quantity?: number;
// }

// interface DonationMatch{
//     id:number;
//     donor_name : string;
//     recipient_name:string;
//     food_type:string;
//     matched_quantity:string,
//     food_description:string;
//     is_claimed:boolean;
    
// }

// interface Donation {
//     id:number;
//     food_type: string;
//     quantity: number;
//     expiry_date: string;
//     food_description?: string;
//     created_at: string; 
    
// }

// interface DashboardData{
//     profile : Profile;
//     matches : DonationMatch[];
//     // claimed_matches : DonationMatch[];
//     donations : Donation[];
//     topUsers: TopUser[];
// }

// const Dashboard : React.FC = () => {
//     const [dashData, setDashData] = useState<DashboardData | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [noMatchesMessage, setNoMatchesMessage] = useState<string | null>(null);
//     const token = useAuthStore(state => state.token);
//     const [claimingId, setClaimingId] = useState<number | null>(null);


//   useEffect(() => {
//   const fetchDashboardData = async () => {
//     try {
//       setError(null);
//       setNoMatchesMessage(null);
//       setLoading(true); 
//       const res = await fetch("http://localhost:8003/FoodBridge/donations/", {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Token ${token}`,
//         },
//       });

//       const profileData = await res.json();
//       console.log("Fetched profileData:", profileData);

//       if (!res.ok) {
//         setError(profileData?.detail || "Failed to fetch profile and donation matches data");
//         return;
//       }

//       let donationData: Donation[] = [];
//       let matchData: DonationMatch[] = [];
//       let topUsersData: TopUser[] = [];

//       if (profileData?.profile?.role === 'donor') {
//         const donorRes = await fetch("http://localhost:8003/FoodBridge/donations/create-donations/", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${token}`,
//           },
//         });

//         const donorDonations = await donorRes.json();
//         if (!donorRes.ok) throw new Error(donorDonations?.detail || "Failed to fetch donations");
//         donationData = donorDonations;
//       } else if (profileData?.profile?.role === 'recipient') {

//         const matchRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-history/", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${token}`,
//           },
//         });
//         const currentMatches = await matchRes.json();
//         if (!matchRes.ok) throw new Error(currentMatches?.detail || "Failed to fetch matches");
//         matchData = currentMatches;
//       }

//         // --- FETCH TOP USERS DATA ---
//                 const topUsersRes = await fetch("http://localhost:8003/FoodBridge/donations/top-users/", {
//                     method: "GET",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Token ${token}`,
//                     },
//                 });

//                 const topUsersJson = await topUsersRes.json();
//                 if (!topUsersRes.ok) {
//                     console.error("Failed to fetch top users:", topUsersJson?.error || topUsersJson?.detail);
//                     // Optionally set an error specifically for top users, or just skip
//                 } else {
//                     // Decide which list to use based on the logged-in user's role
//                     if (profileData?.profile?.role === 'donor' && topUsersJson.top_recipients) {
//                         topUsersData = topUsersJson.top_recipients;
//                     } else if (profileData?.profile?.role === 'recipient' && topUsersJson.top_donors) {
//                         topUsersData = topUsersJson.top_donors;
//                     }
//                 }

//       setDashData({ ...profileData, donations: donationData, matches: matchData,topUsers: topUsersData });
//     } catch (err) {
//       console.error("Profile fetch error:", err);
//       setError("An error occurred while fetching profile");
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchDashboardData();
// }, [token]);

//         const claimDonation = async (matchId: number): Promise<boolean> => {
//             try {
//               console.log(`[claimDonation] Starting claim for matchId: ${matchId}`);
//               setClaimingId(matchId);

//               const response = await fetch(`http://localhost:8003/FoodBridge/donations/matches/${matchId}/claim/`, {
//                 method: 'POST',
//                 headers: {
//                   'Authorization': `Token ${token}`,
//                   'Content-Type': 'application/json',
//                 },
//               });

//               const data = await response.json();
//               console.log(`[claimDonation] Response:`, response.status, data);

//               if (response.ok) {
//                 toast.success('Donation successfully claimed!');
//                 return true;
//               } else {
//                 toast.error(data?.detail || "Failed to claim donation");
//                 return false;
//               }
//             } catch (err) {
//               console.error(`[claimDonation] Unexpected error:`, err);
//               toast.error("An unexpected error occurred while claiming donation.");
//               return false;
//             } finally {
//               setClaimingId(null);
//             }
//           };

//         // const generatedMatches = async () => {
//         //      if (!token || !dashData?.profile || dashData.profile.role !== 'recipient') return;

//         //     const recipientProfile = dashData.profile; 
//         // if (!recipientProfile) {
//         //     throw new Error("Recipient profile not available for matching.");
//         // }

//         // const quantityToSend = typeof recipientProfile.required_quantity === 'string'
//         //     ? parseFloat(recipientProfile.required_quantity)
//         //     : recipientProfile.required_quantity;

//         // const matchRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-matches/", {
//         //   method: "POST",
//         //   headers: {
//         //     "Content-Type": "application/json",
//         //     Authorization: `Token ${token}`,
//         //   },
//         //   body: JSON.stringify({
//         //     recipient_food_type: recipientProfile.required_food_type,
//         //     required_quantity: quantityToSend,
//         // }),
//         // });

//         // const fetchedMatches = await matchRes.json();
//         // if (!matchRes.ok) {
//         //     if (matchRes.status === 404 && fetchedMatches?.message) {
//         //         setNoMatchesMessage(fetchedMatches.message);
//         //         toast.error(fetchedMatches.message);
//         //         // matchData = []; 
//         //     } else if (matchRes.status === 204 && fetchedMatches?.message) {
//         //         setNoMatchesMessage(fetchedMatches.message);
//         //         toast.success(fetchedMatches.message);
//         //     }
//         //     else {
//         //         // For other errors, set the general error state
//         //         setError(fetchedMatches?.detail || "Failed to fetch matches");
//         //         // matchData = [];
//         //     }
//         //   }
//         // }



//      if (loading) return <div className="animate-pulse text-gray-500">Loading dashboard...</div>
//      if (error) return <div>Error: {error}</div>;
//      if (!dashData) return null;
     
//      const { profile,matches ,donations,topUsers} = dashData;
//      const role = profile.role.toLowerCase();
//      if (!profile?.role) {
//         return <div>Error: User role not found in profile data</div>;
//       }
//      console.log("role",role);


//   return (
//     <main className="flex-1 p-6 overflow-auto">
//         {/* <!-- Navbar --> */}
//         <div className="flex items-center w-full justify-end">
            
//             <div className="flex items-center space-x-4 ml-4">
//             <Link to="/donate">
//               {role === 'donor' && <button className="bg-blue-600 text-white px-4 py-2 rounded">New Donation<span className="ml-2 items-center flex"><Plus className='h-8 w-8'/></span>
//               </button>}
//             </Link>
            

//             <NotificationBell/>

//               {/* <!-- Avatar Dropdown --> */}
//               <div className="relative group flex flex-cols">
//                 <CustomAvatar/>
//                 {/* <span className="font-semibold text-gray-800 hidden md:inline">{profile.user.name}</span> */}
//                 <DropdownMenu >
//                     <DropdownMenuTrigger>
//                             <ChevronDown className='h-8 w-8 px-1'/>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent>
//                         <DropdownMenuItem>
//                             Recipient
//                         </DropdownMenuItem>
//                     </DropdownMenuContent>
//                 </DropdownMenu>
                
//               </div>
//             </div>
//           </div>

//       {/* Main Content */}
//       {/* <!-- Donations --> */}
//       <section className="mb-8">
//         <div className='flex justify-between'>
//           <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">{role === 'donor' ? 'Your Donations' : 'Available Donations'}</h2>
//           <Link className="text-2xl/10 font-bold mb-4 text-right px-2 text-sky-400" to="#">See More</Link>
//         </div>
//           <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
             
//               {/* render donations based on role */}
//             <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
//             {/*  uploaded donations by donor */}
//             {role === 'donor' && donations?.map((donation) => (
//             <div key={donation.id} className="bg-white p-4 rounded shadow text-left">
//                 <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
//                 <h3 className="font-semibold">{donation.food_type}</h3>
//                 <h3 className="font-semibold">Quantity : {donation.quantity}</h3>
//                 Expires: <strong>{new Date(donation.expiry_date).toLocaleString(undefined, {
//                   year: 'numeric', month: 'short', day: 'numeric'
//                 })}</strong>

//             </div>
//             ))}

//             {role === 'donor' && donations?.length === 0 && (
//               <div className="text-gray-500 col-span-3 mt-4">
//                 You haven't added any donations yet. Click "New Donation" to get started!
//               </div>
//             )}
               
//           {/* matched donations for recipient  */}
//           {role === 'recipient' && (
//               <>
//                 {matches?.length > 0 ? (
//                   <div className="grid grid-cols-1 md:grid-cols-3 col-span-3"> 
//                     {matches.map((match) => (
//                       <div key={match.id} className="bg-white p-4 rounded shadow-lg text-left">
//                         <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
//                         <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
//                         <p className="text-sm text-gray-600">Donor: <span className="font-medium">{match.donor_name}</span></p>
//                         <p className="text-sm text-gray-700">Quantity: {match.matched_quantity}</p>
//                         <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
//                         {/* <button
//                             className='bg-yellow-300 text-white p-2 font-medium text-sm rounded'
//                             disabled={match.is_claimed}
//                             onClick={() => claimDonation(match.id)}
//                           >
//                             {match.is_claimed ? "Already Claimed" : "Claim"}
//                           </button> */}
//                     <button
//                     type='button'
//                     className={`p-2 font-medium text-sm rounded transition ${
//                       match.is_claimed ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-400 text-white hover:bg-yellow-500'
//                     }`}
//                     disabled={match.is_claimed || claimingId === match.id}
//                     onClick={() => claimDonation(match.id)}
//                   >
//                     {claimingId === match.id ? (
//                       <span className="flex items-center gap-1">
//                         <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
//                           <circle
//                             className="opacity-25"
//                             cx="12" cy="12" r="10"
//                             stroke="currentColor" strokeWidth="4" fill="none"
//                           />
//                           <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                           />
//                         </svg>
//                         Claiming...
//                       </span>
//                     ) : (
//                       match.is_claimed ? "Already Claimed" : "Claim"
//                     )}
//                   </button>

//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   // Display message when no matches are found
//                   <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700">
//                     <p className="text-lg font-medium">
//                         {noMatchesMessage || "No available donations found matching your criteria at this time. Please check back later or update your required food type."}
//                     </p>
//                   </div>
//                 )}
//               </>
//             )}

//             </div>

//                {/* Top Users list based on role */}
//               <div className="p-4 col-span-1">                              
//               <h3 className="font-semibold mb-2">
//               {role === 'donor' ? 'Top Recipients' : 'Top Donors'}</h3>
//               <ul className="space-y-2">
//                  {topUsers.length > 0 ? (
//                                 topUsers.map((user, i) => (
//                                     <li key={i} className="flex justify-between items-center p-4 rounded border border-gray-200">
//                                         <CustomAvatar />
//                                         <span className='text-base p-2'>{user.name}</span>
//                                         <span className='text-base p-2'>{user.total_quantity_kg}kg</span>
//                                     </li>
//                                 ))
//                             ) : (
//                                 <li className="text-sm text-gray-500 text-center">No top {role === 'donor' ? 'recipients' : 'donors'} data available.</li>
//                             )}
//               </ul>
//               </div>
              
//           </div>
//       </section>

//       {/* <!-- Statistics and Donors --> */}
//       <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* <!-- Statistics Chart --> */}
//           <div className="bg-white p-4 rounded shadow col-span-2">
//               <h3 className="font-semibold mb-2">Statistics</h3>
//               <div className="h-48 bg-gray-200 flex items-center justify-center">[Chart Placeholder]</div>
        
//           </div>

//           {/* total donations with their statuses */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1">
//           <div className="bg-white p-4 rounded shadow text-left">
//                   {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
//                   <h3 className="font-semibold">Maize</h3>
//                   <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
//                   <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
//                   <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
//               </div>
//               <div className="bg-white p-4 rounded shadow text-left">
//                   {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
//                   <h3 className="font-semibold">Maize</h3>
//                   <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
//                   <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
//                   <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
//               </div>
//               <div className="bg-white p-4 rounded shadow text-left">
//                   {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
//                   <h3 className="font-semibold">Maize</h3>
//                   <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
//                   <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
//                   <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
//               </div>
//               <div className="bg-white p-4 rounded shadow text-left">
//                   {/* <img src="../../public/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full"/> */}
//                   <h3 className="font-semibold">Maize</h3>
//                   <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
//                   <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
//                   <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
//               </div>
              
//           </div>
//       </section>

//       {/* <!-- Summary --> */}
//       <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
//           <div className="bg-white p-4 rounded shadow text-center">
//               <h4 className="text-sm text-gray-500">Total Donation</h4>
//               <p className="text-lg font-bold">$1,214,501</p>
//           </div>
//           <div className="bg-white p-4 rounded shadow text-center">
//               <h4 className="text-sm text-gray-500">Donation Today</h4>
//               <p className="text-lg font-bold">$7,925</p>
//           </div>
//           <div className="bg-white p-4 rounded shadow text-center">
//               <h4 className="text-sm text-gray-500">Total Donor</h4>
//               <p className="text-lg font-bold">2,581</p>
//           </div>
//           <div className="bg-white p-4 rounded shadow text-center">
//               <h4 className="text-sm text-gray-500">Average Donation</h4>
//               <p className="text-lg font-bold">$285.56</p>
//           </div>
//       </section>
 
//     </main>
//   );
// };

// export default Dashboard;



// //     // --- Function to Generate NEW Matches for Recipient ---
// //     const generateNewMatches = async () => {
// //         if (!token || !dashData?.profile || dashData.profile.role !== 'recipient') return;

// //         setIsGeneratingMatches(true); // Set loading state for generation
// //         setNoNewMatchesMessage(null); // Clear previous messages

// //         try {
// //             const recipientProfile = dashData.profile;
// //             if (!recipientProfile.required_food_type || !recipientProfile.required_quantity) {
// //                 toast.error("Please set your required food type and quantity in your profile to find matches.");
// //                 setIsGeneratingMatches(false);
// //                 return;
// //             }

// //             // Ensure quantityToSend is a number
// //             const quantityToSend = typeof recipientProfile.required_quantity === 'string'
// //                 ? parseFloat(recipientProfile.required_quantity)
// //                 : recipientProfile.required_quantity;

// //             // This is the correct POST endpoint for GENERATING new matches
// //             const matchRes = await fetch("http://localhost:8003/FoodBridge/donations/donation-matches/", {
// //                 method: "POST",
// //                 headers: {
// //                     "Content-Type": "application/json",
// //                     Authorization: `Token ${token}`,
// //                 },
// //                 body: JSON.stringify({
// //                     recipient_food_type: recipientProfile.required_food_type,
// //                     required_quantity: quantityToSend,
// //                     lat: recipientProfile.lat, // Pass recipient's lat/lng for distance calculation
// //                     lng: recipientProfile.lng,
// //                 }),
// //             });

// //             const recipientMatches = await matchRes.json();

// //             // Corrected error/success handling for match generation POST request
// //             if (!matchRes.ok) {
// //                 if ((matchRes.status === 200 || matchRes.status === 204) && recipientMatches?.message) {
// //                     // Backend might send 200/204 with a message if no new matches were found
// //                     setNoNewMatchesMessage(recipientMatches.message);
// //                     toast.success(recipientMatches.message); // Inform user
// //                 } else if (matchRes.status === 404 && recipientMatches?.message) {
// //                     // If no donations found for initial filter on backend
// //                     setNoNewMatchesMessage(recipientMatches.message);
// //                     toast.error(recipientMatches.message);
// //                 } else {
// //                     toast.error(recipientMatches?.error || recipientMatches?.detail || "Failed to generate new matches.");
// //                 }
// //             } else {
// //                 // If new matches were successfully generated (backend responded with 200/201 and matches data)
// //                 const newlyGeneratedMatches: DonationMatch[] = recipientMatches.matches;

// //                 // Deduplicate and update matches state
// //                 setDashData(prev => {
// //                     if (!prev) return null;
// //                     const existingMatchIds = new Set(prev.matches.map(m => m.id));
// //                     const uniqueNewMatches = newlyGeneratedMatches.filter(m => !existingMatchIds.has(m.id));

// //                     return {
// //                         ...prev,
// //                         matches: [...prev.matches, ...uniqueNewMatches]
// //                     };
// //                 });
// //                 if (newlyGeneratedMatches.length > 0) {
// //                     toast.success(`${newlyGeneratedMatches.length} new matches generated!`);
// //                 } else {
// //                     setNoNewMatchesMessage("No new matches found based on your current criteria.");
// //                     toast.info("No new matches found at this time.");
// //                 }
// //             }
// //         } catch (err: any) {
// //             console.error("Error generating new matches:", err);
// //             toast.error(err.message || "An unexpected error occurred during match generation.");
// //         } finally {
// //             setIsGeneratingMatches(false); // Reset loading state
// //         }
// //     };


// //     const claimDonation = async (matchId: number): Promise<void> => {
// //         try {
// //             console.log(`[claimDonation] Starting claim for matchId: ${matchId}`);
// //             setClaimingId(matchId);

// //             const response = await fetch(`http://localhost:8003/FoodBridge/donations/matches/${matchId}/claim/`, {
// //                 method: 'POST',
// //                 headers: {
// //                     'Authorization': `Token ${token}`,
// //                     'Content-Type': 'application/json',
// //                 },
// //             });

// //             const data = await response.json();
// //             console.log(`[claimDonation] Response:`, response.status, data);

// //             if (response.ok) {
// //                 toast.success('Donation successfully claimed!');
// //                 // --- IMPORTANT: Update the UI by removing the claimed match ---
// //                 setDashData(prevDashData => {
// //                     if (!prevDashData) return null;
// //                     const updatedMatches = prevDashData.matches.filter(match => match.id !== matchId);
// //                     return { ...prevDashData, matches: updatedMatches };
// //                 });
// //             } else {
// //                 toast.error(data?.detail || data?.message || "Failed to claim donation"); // Check both detail and message
// //             }
// //         } catch (err) {
// //             console.error(`[claimDonation] Unexpected error:`, err);
// //             toast.error("An unexpected error occurred while claiming donation.");
// //         } finally {
// //             setClaimingId(null);
// //         }
// //     };


// //     if (loading) return <div className="animate-pulse text-gray-500">Loading dashboard...</div>
// //     if (error) return <div>Error: {error}</div>;
// //     if (!dashData) return null;

// //     const { profile, matches, donations, topUsers } = dashData;
// //     const role = profile.role?.toLowerCase(); // Use optional chaining for safety
// //     if (!role) { // Check if role is missing or null
// //         return <div>Error: User role not found in profile data. Please ensure you are logged in.</div>;
// //     }
// //     console.log("Current user role:", role);


// //     return (
// //         <main className="flex-1 p-6 overflow-auto">
// //             {/* */}
// //             <div className="flex items-center w-full justify-end">

// //                 <div className="flex items-center space-x-4 ml-4">
// //                     <Link to="/donate">
// //                         {role === 'donor' && <button className="bg-blue-600 text-white px-4 py-2 rounded">New Donation<span className="ml-2 items-center flex"><Plus className='h-8 w-8' /></span>
// //                         </button>}
// //                     </Link>

// //                     {/* Button for Recipients to Generate New Matches */}
// //                     {role === 'recipient' && (
// //                         <button
// //                             onClick={generateNewMatches}
// //                             disabled={isGeneratingMatches}
// //                             className={`bg-green-600 text-white px-4 py-2 rounded transition ${isGeneratingMatches ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'}`}
// //                         >
// //                             {isGeneratingMatches ? (
// //                                 <span className="flex items-center gap-2">
// //                                     <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
// //                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
// //                                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
// //                                     </svg>
// //                                     Finding Matches...
// //                                 </span>
// //                             ) : (
// //                                 <span className="flex items-center gap-2">
// //                                     Find New Matches <Plus className='h-5 w-5' />
// //                                 </span>
// //                             )}
// //                         </button>
// //                     )}


// //                     <NotificationBell />

// //                     {/* */}
// //                     <div className="relative group flex flex-cols">
// //                         <CustomAvatar />
// //                         <DropdownMenu >
// //                             <DropdownMenuTrigger>
// //                                 <ChevronDown className='h-8 w-8 px-1' />
// //                             </DropdownMenuTrigger>
// //                             <DropdownMenuContent>
// //                                 <DropdownMenuItem>
// //                                     Profile
// //                                 </DropdownMenuItem>
// //                                 <DropdownMenuItem>
// //                                     Settings
// //                                 </DropdownMenuItem>
// //                                 {/* Add logout button */}
// //                                 <DropdownMenuItem onClick={() => useAuthStore.getState().clearAuth()}>
// //                                     Logout
// //                                 </DropdownMenuItem>
// //                             </DropdownMenuContent>
// //                         </DropdownMenu>

// //                     </div>
// //                 </div>
// //             </div>

// //             {/* Main Content */}
// //             {/* */}
// //             <section className="mb-8">
// //                 <h2 className="text-3xl/10 font-bold mb-4 text-left px-2">
// //                     {role === 'donor' ? 'Your Active Donations' : 'Your Available Matches'}
// //                 </h2>
// //                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

// //                     <div className="grid grid-cols-1 md:grid-cols-3 col-span-3">
// //                         {/* uploaded donations by donor */}
// //                         {role === 'donor' && donations?.map((donation) => (
// //                             <div key={donation.id} className="bg-white p-4 rounded shadow text-left">
// //                                 <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
// //                                 <h3 className="font-semibold">{donation.food_type}</h3>
// //                                 <h3 className="font-semibold">Quantity : {donation.quantity}</h3>
// //                                 Expires: <strong>{new Date(donation.expiry_date).toLocaleString(undefined, {
// //                                     year: 'numeric', month: 'short', day: 'numeric'
// //                                 })}</strong>
// //                                 {/* Potentially add status for donor's donations here (e.g., pending, partially matched, fully claimed) */}
// //                             </div>
// //                         ))}

// //                         {role === 'donor' && donations?.length === 0 && (
// //                             <div className="text-gray-500 col-span-3 mt-4">
// //                                 You haven't added any donations yet. Click "New Donation" to get started!
// //                             </div>
// //                         )}

// //                         {/* matched donations for recipient  */}
// //                         {role === 'recipient' && (
// //                             <>
// //                                 {noNewMatchesMessage && !matches.length && (
// //                                     <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700 col-span-3">
// //                                         <p className="text-lg font-medium">
// //                                             {noNewMatchesMessage}
// //                                         </p>
// //                                     </div>
// //                                 )}
// //                                 {matches?.length > 0 ? (
// //                                     <div className="grid grid-cols-1 md:grid-cols-3 col-span-3 gap-4">
// //                                         {matches.map((match) => (
// //                                             <div key={match.id} className="bg-white p-4 rounded shadow-lg text-left">
// //                                                 <img src="/images/download (1).jpeg" alt="donated-img" className="rounded-md mb-2 w-full" />
// //                                                 <h3 className="font-semibold text-lg text-indigo-700">{match.food_type}</h3>
// //                                                 <p className="text-sm text-gray-600">Donor: <span className="font-medium">{match.donor_name}</span></p>
// //                                                 <p className="text-sm text-gray-700">Quantity: {match.matched_quantity} kg</p>
// //                                                 <p className="text-sm text-gray-600 italic mt-1">{match.food_description}</p>
// //                                                 <p className="text-xs text-gray-500 mt-1">Expires: {new Date(match.expiry_date).toLocaleDateString()}</p>
// //                                                 <p className="text-xs text-gray-500">Matched On: {new Date(match.created_at).toLocaleDateString()}</p>
// //                                                 <button
// //                                                     type='button'
// //                                                     className={`mt-3 p-2 font-medium text-sm rounded transition w-full ${
// //                                                         match.is_claimed || claimingId === match.id
// //                                                             ? 'bg-gray-400 cursor-not-allowed'
// //                                                             : 'bg-yellow-400 text-white hover:bg-yellow-500'
// //                                                         }`}
// //                                                     disabled={match.is_claimed || claimingId === match.id}
// //                                                     onClick={() => claimDonation(match.id)}
// //                                                 >
// //                                                     {claimingId === match.id ? (
// //                                                         <span className="flex items-center justify-center gap-1">
// //                                                             <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
// //                                                                 <circle
// //                                                                     className="opacity-25"
// //                                                                     cx="12" cy="12" r="10"
// //                                                                     stroke="currentColor" strokeWidth="4" fill="none"
// //                                                                 />
// //                                                                 <path
// //                                                                     className="opacity-75"
// //                                                                     fill="currentColor"
// //                                                                     d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
// //                                                                 />
// //                                                             </svg>
// //                                                             Claiming...
// //                                                         </span>
// //                                                     ) : (
// //                                                         match.is_claimed ? "Already Claimed" : "Claim This Donation"
// //                                                     )}
// //                                                 </button>
// //                                             </div>
// //                                         ))}
// //                                     </div>
// //                                 ) : (
// //                                     // Display message when no matches are found, AND no specific message from generateNewMatches
// //                                     !noNewMatchesMessage && (
// //                                         <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-700 col-span-3">
// //                                             <p className="text-lg font-medium">
// //                                                 You currently have no available matches. Click "Find New Matches" to see if there are any donations for you!
// //                                             </p>
// //                                         </div>
// //                                     )
// //                                 )}
// //                             </>
// //                         )}

// //                     </div>

// //                     {/* Top Users list based on role */}
// //                     <div className="p-4 col-span-1">
// //                         <h3 className="font-semibold mb-2">
// //                             {role === 'donor' ? 'Top Recipients' : 'Top Donors'}</h3>
// //                         <ul className="space-y-2">
// //                             {topUsers.length > 0 ? (
// //                                 topUsers.map((user, i) => (
// //                                     <li key={i} className="flex justify-between items-center p-4 rounded border border-gray-200">
// //                                         <CustomAvatar />
// //                                         <span className='text-base p-2'>{user.name}</span>
// //                                         <span className='text-base p-2'>{user.total_quantity_kg}kg</span>
// //                                     </li>
// //                                 ))
// //                             ) : (
// //                                 <li className="text-sm text-gray-500 text-center">No top {role === 'donor' ? 'recipients' : 'donors'} data available.</li>
// //                             )}
// //                         </ul>
// //                     </div>

// //                 </div>
// //             </section>

// //             {/* */}
// //             <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// //                 {/* */}
// //                 <div className="bg-white p-4 rounded shadow col-span-2">
// //                     <h3 className="font-semibold mb-2">Statistics</h3>
// //                     <div className="h-48 bg-gray-200 flex items-center justify-center">[Chart Placeholder]</div>

// //                 </div>

// //                 {/* total donations with their statuses */}
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1">
// //                     <div className="bg-white p-4 rounded shadow text-left">
// //                         <h3 className="font-semibold">Maize</h3>
// //                         <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
// //                         <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
// //                         <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
// //                     </div>
// //                     <div className="bg-white p-4 rounded shadow text-left">
// //                         <h3 className="font-semibold">Maize</h3>
// //                         <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
// //                         <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
// //                         <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
// //                     </div>
// //                     <div className="bg-white p-4 rounded shadow text-left">
// //                         <h3 className="font-semibold">Maize</h3>
// //                         <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
// //                         <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
// //                         <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
// //                     </div>
// //                     <div className="bg-white p-4 rounded shadow text-left">
// //                         <h3 className="font-semibold">Maize</h3>
// //                         <div className="text-sm text-gray-600 mb-2 font-medium">Imara Daima</div>
// //                         <div className="text-sm">Quantity: <strong>150,512kg</strong></div>
// //                         <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">Pending</button>
// //                     </div>

// //                 </div>
// //             </section>

// //             {/* */}
// //             <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
// //                 <div className="bg-white p-4 rounded shadow text-center">
// //                     <h4 className="text-sm text-gray-500">Total Donation</h4>
// //                     <p className="text-lg font-bold">$1,214,501</p>
// //                 </div>
// //                 <div className="bg-white p-4 rounded shadow text-center">
// //                     <h4 className="text-sm text-gray-500">Donation Today</h4>
// //                     <p className="text-lg font-bold">$7,925</p>
// //                 </div>
// //                 <div className="bg-white p-4 rounded shadow text-center">
// //                     <h4 className="text-sm text-gray-500">Total Donor</h4>
// //                     <p className="text-lg font-bold">2,581</p>
// //                 </div>
// //                 <div className="bg-white p-4 rounded shadow text-center">
// //                     <h4 className="text-sm text-gray-500">Average Donation</h4>
// //                     <p className="text-lg font-bold">$285.56</p>
// //                 </div>
// //             </section>

// //         </main>
// //     );
// // };

// // export default Dashboard;
