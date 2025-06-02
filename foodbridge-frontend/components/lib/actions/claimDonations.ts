// export const claimDonations = async (matchId : number, token: string | null) => {
//   const response = await fetch(`http://localhost:8003/FoodBridge/donations/donations/request/`, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Token ${token}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ match_id: matchId }),
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.error || 'Failed to request donation');
//   }

//   return response.json();
// };
