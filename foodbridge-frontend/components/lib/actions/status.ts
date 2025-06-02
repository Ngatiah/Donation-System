// export async function respondToMatch(matchId, status) {
//   const res = await fetch(`http://localhost:8003/FoodBridge/donations/matches/${matchId}/respond/`, {
//     method: "POST",
//     headers: {
//       Authorization: `Token ${userToken}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ status }),
//   });

//   if (res.ok) {
//     await refetchMatches();  // or update local match status
//   } else {
//     console.error("Failed to update match");
//   }
// }

// export async function fulfillMatch(matchId) {
//   const res = await fetch(`http://localhost:8003/FoodBridge/donations/matches/${matchId}/fulfill/`, {
//     method: "POST",
//     headers: {
//       Authorization: `Token ${userToken}`,
//     },
//   });

//   if (res.ok) {
//     await refetchMatches(); // or update match/donation status in UI
//   } else {
//     console.error("Failed to fulfill match");
//   }
// }


// export const cancelDonation = async (donationId, token) => {
//   const response = await fetch(`http://localhost:8003/FoodBridge/donations/donations/${donationId}/cancel/`, {
//     method: 'PATCH',
//     headers: {
//       'Authorization': `Token ${token}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.error || 'Failed to cancel donation');
//   }

//   return response.json();
// };

// export const updateMatchStatus = async (matchId, status, token) => {
//   const response = await fetch(`http://localhost:8003/FoodBridge/donations/matches/${matchId}/update-status/`, {
//     method: 'PATCH',
//     headers: {
//       'Authorization': `Token ${token}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ status }),
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.error || 'Failed to update match status');
//   }

//   return response.json();
// };


// export const requestDonationById = async (donationId, token) => {
//   const response = await fetch(`http://localhost:8003/FoodBridge/donations/donations/request/`, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Token ${token}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ donation_id: donationId }),
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.error || 'Failed to request donation');
//   }

//   return response.json();
// };

