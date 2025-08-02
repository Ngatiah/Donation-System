// import React, { useEffect, useState } from "react";
// import { useAuthStore } from "../../store/authStore";
// import { useNavigate } from "react-router-dom";

// // interface RecipientNeedResponse {
// //   food_type: string[];
// //   quantity: number;
// // }

// const RecipientNeedPromptModal: React.FC = () => {
//   const [showModal, setShowModal] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const token = useAuthStore((state) => state.token);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchAndCheckNeeds();
//   }, []);

//   async function fetchAndCheckNeeds() {
//     try {
//       const res = await fetch(
//         "http://localhost:8003/FoodBridge/recipient-need-update/",
//         {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Token ${token}`,
//           },
//         }
//       );

//       if (res.status === 403) {
//       setError("You can only update your needs once every 30 days.");
//       return;
//     }

//     const data = await res.json();
//     if (!res.ok) {
//       setError(data?.detail || "Failed to fetch current needs.");
//       return;
//     }

//     //    if no needs or needs expired, prompt user
//     // if (!data || data.needs_expired || data.needs.length === 0) {
//       //  if needs expired, prompt user
//     if (!data || !data.food_type || data.food_type.length === 0 || !data.quantity ) {
//         setShowModal(true);
//       }

//     } catch (err) {
//       console.error(err);
//       setError("An unexpected error occurred.");
//     }
//   }

//   function handleConfirmUpdate() {
//     navigate("/recipient-need-update");
//   }

//   return (
//     <>
//       {showModal && (
//         <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center" role="dialog" aria-modal="true">
//           <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
//             <h2 className="text-lg font-semibold mb-4">Update Your Monthly Needs</h2>
//             <p className="text-gray-700 mb-4">
//               We noticed your food need information is outdated.
//               Please update it to get accurate matches.
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
//                 onClick={() => setShowModal(false)}
//               >
//                 Not Now
//               </button>
//               <button
//                 className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
//                 onClick={handleConfirmUpdate}
//                 // type="submit"
//               >
//                 Update Now
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {error && (
//         <p className="text-red-500 text-center mt-4">{error}</p>
//       )}
//     </>
//   );
// };

// export default RecipientNeedPromptModal;
