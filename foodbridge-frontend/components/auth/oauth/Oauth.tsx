// import React from 'react';
// import { Button } from '@mui/material'; // Or your custom Button component

// const GoogleAuthButton = () => {
//     const handleGoogleSignIn = () => {
//         // Replace with your actual backend allauth Google login URL
//         // This is typically provided by allauth.socialaccount.providers.google.urls
//         // Make sure your Django backend is running and accessible at this URL
//         window.location.href = 'http://localhost:8000/accounts/google/login/';
//     };

//     return (
//         <Button onClick={handleGoogleSignIn} variant="outlined">
//             Sign in with Google
//         </Button>
//     );
// };

// export default GoogleAuthButton;

// import React from 'react';
// import { Button } from '@mui/material'; // Or your custom Button component

// const GoogleAuthButton = () => {
//     const handleGoogleSignIn = () => {
//         const popup = window.open(
//             'http://localhost:8000/accounts/google/login/', // Your backend allauth Google login URL
//             'GoogleAuthPopup',
//             'width=500,height=600'
//         );

//         // Listen for messages from the popup (if your backend sends one, or if it redirects to a script)
//         window.addEventListener('message', (event) => {
//             if (event.origin === window.location.origin && event.data.type === 'authSuccess') {
//                 // Assuming the popup sends a message like { type: 'authSuccess', token: '...' }
//                 console.log('Authentication successful:', event.data.token);
//                 // Close the popup
//                 if (popup) popup.close();
//                 // Update your frontend state, e.g., navigate, fetch user data
//                 // navigate('/home');
//             }
//         });

//         // Poll the popup window to check if it's closed (alternative to messaging)
//         const checkPopup = setInterval(() => {
//             if (popup && popup.closed) {
//                 clearInterval(checkPopup);
//                 console.log('Popup closed. Now check authentication status.');
//                 // After the popup closes, you'd typically make an API call to your backend
//                 // to verify the user's logged-in status (e.g., /api/user or check for cookie)
//                 // If your backend sets an HttpOnly cookie, you might just refresh the page.
//                 // Or if using tokens, you might fetch it from local storage/cookies if it was set
//                 // by a redirect on the popup's final URL.
//                 // This often requires customizing allauth's redirect behavior.
//             }
//         }, 1000);
//     };

//     return (
//         <Button onClick={handleGoogleSignIn} variant="outlined">
//             Sign in with Google (Pop-up)
//         </Button>
//     );
// };

// export default GoogleAuthButton;