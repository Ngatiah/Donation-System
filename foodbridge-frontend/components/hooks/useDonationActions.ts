// // // src/hooks/useDonationActions.ts
// // import { useState, useCallback } from 'react';
// // import { useAuthStore } from '../../store/authStore';

// // interface UseDonationActionsResult {
// //     updateMatchStatus: (matchId: number, newStatus: 'accepted' | 'declined' | 'fulfilled') => Promise<void>;
// //     updateDonationStatus: (donationId: number, newStatus: 'pending' | 'matched' | 'fulfilled' | 'declined_by_recipient' | 'unavailable') => Promise<void>;
// //     statusLoading: boolean;
// //     statusError: string | null;
// //     clearError: () => void;
// // }

// // export const useDonationActions = (): UseDonationActionsResult => {
// //     const [statusLoading, setLoadingStatus] = useState(false);
// //     const [statusError, setStatusError] = useState<string | null>(null);
// //     const token = useAuthStore(state => state.token);

// //     const clearError = useCallback(() => {
// //         setStatusError(null);
// //     }, []);

// //     const updateMatchStatus = useCallback(async (matchId: number, newStatus: 'accepted' | 'declined' | 'fulfilled') => {
// //         setLoadingStatus(true);
// //         setStatusError(null);
// //         try {
// //             const res = await fetch(`http://localhost:8003/FoodBridge/donations/matches/${matchId}/status/`, {
// //                 method: 'PATCH',
// //                 headers: {
// //                     'Content-Type': 'application/json',
// //                     'Authorization': `Token ${token}`,
// //                 },
// //                 body: JSON.stringify({ status: newStatus }),
// //             });

// //             const data = await res.json();
// //             if (!res.ok) {
// //                 throw new Error(data?.detail || `Failed to update match status to ${newStatus}`);
// //             }
// //             console.log(`Match ${matchId} status updated to ${newStatus}`, data);
// //         } catch (err) {
// //             console.error('Error updating match status:', err);
// //             setStatusError((err as Error).message || `An error occurred while updating match status to ${newStatus}.`);
// //             throw err; // Re-throw to allow component to handle if needed
// //         } finally {
// //             setLoadingStatus(false);
// //         }
// //     }, [token]);

// //     const updateDonationStatus = useCallback(async (donationId: number, newStatus: 'pending' | 'matched' | 'fulfilled' | 'declined_by_recipient' | 'unavailable') => {
// //         setLoadingStatus(true);
// //         setStatusError(null);
// //         try {
// //             const res = await fetch(`http://localhost:8003/FoodBridge/donations/donations/${donationId}/status/`, {
// //                 method: 'PATCH',
// //                 headers: {
// //                     'Content-Type': 'application/json',
// //                     'Authorization': `Token ${token}`,
// //                 },
// //                 body: JSON.stringify({ status: newStatus }),
// //             });

// //             const data = await res.json();
// //             if (!res.ok) {
// //                 throw new Error(data?.detail || `Failed to update donation status to ${newStatus}`);
// //             }
// //             console.log(`Donation ${donationId} status updated to ${newStatus}`, data);
// //         } catch (err) {
// //             console.error('Error updating donation status:', err);
// //             setStatusError((err as Error).message || `An error occurred while updating donation status to ${newStatus}.`);
// //             throw err;
// //         } finally {
// //             setLoadingStatus(false);
// //         }
// //     }, [token]);

// //     return { updateMatchStatus, updateDonationStatus, statusLoading, statusError, clearError };
// // };

// import { useState, useCallback } from 'react';
// import { useAuthStore } from '../../store/authStore';

// interface UseDonationActionsResult {
//     updateMatchStatus: (matchId: number, newStatus: 'accepted' | 'declined' | 'fulfilled') => Promise<void>;
//     updateDonationStatus: (donationId: number, newStatus: 'unavailable_by_donor') => Promise<void>; // Donor only
//     statusLoading: boolean;
//     statusError: string | null;
//     clearError: () => void;
// }

// export const useDonationActions = (): UseDonationActionsResult => {
//     const [statusLoading, setLoadingStatus] = useState(false);
//     const [statusError, setStatusError] = useState<string | null>(null);
//     const token = useAuthStore(state => state.token);

//     const clearError = useCallback(() => {
//         setStatusError(null);
//     }, []);

//     const updateMatchStatus = useCallback(async (matchId: number, newStatus: 'accepted' | 'declined' | 'fulfilled') => {
//         setLoadingStatus(true);
//         setStatusError(null);
//         try {
//             const res = await fetch(`http://localhost:8003/FoodBridge/donations/matches/${matchId}/status/`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Token ${token}`,
//                 },
//                 body: JSON.stringify({ status: newStatus }),
//             });

//             const data = await res.json();
//             if (!res.ok) {
//                 throw new Error(data?.detail || `Failed to update match status to ${newStatus}`);
//             }
//             console.log(`Match ${matchId} status updated to ${newStatus}`, data);
//         } catch (err) {
//             console.error('Error updating match status:', err);
//             setStatusError((err as Error).message || `An error occurred while updating match status to ${newStatus}.`);
//             throw err;
//         } finally {
//             setLoadingStatus(false);
//         }
//     }, [token]);

//     const updateDonationStatus = useCallback(async (donationId: number, newStatus: 'unavailable_by_donor') => {
//         setLoadingStatus(true);
//         setStatusError(null);
//         try {
//             const res = await fetch(`http://localhost:8003/FoodBridge/donations/donations/${donationId}/status/`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Token ${token}`,
//                 },
//                 body: JSON.stringify({ status: newStatus }),
//             });

//             const data = await res.json();
//             if (!res.ok) {
//                 throw new Error(data?.detail || `Failed to update donation status to ${newStatus}`);
//             }
//             console.log(`Donation ${donationId} status updated to ${newStatus}`, data);
//         } catch (err) {
//             console.error('Error updating donation status:', err);
//             setStatusError((err as Error).message || `An error occurred while updating donation status to ${newStatus}.`);
//             throw err;
//         } finally {
//             setLoadingStatus(false);
//         }
//     }, [token]);

//     return { updateMatchStatus, updateDonationStatus, statusLoading, statusError, clearError };
// };

