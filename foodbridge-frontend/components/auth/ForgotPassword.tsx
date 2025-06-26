import React, { useState } from "react";
import ResetForm from "./ResetForm";
import {Link} from 'react-router-dom'

interface TokenInfo {
  user_id: number;
  reset_token: string;
}

const ForgotPassword : React.FC = ()=> {
  const [email, setEmail] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  const handleRequest = async () => {
    const res = await fetch('http://localhost:8003/FoodBridge/donations/request-password-reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      setTokenInfo(data); // { reset_token, user_id }
    } else {
      alert("User not found.");
    }
  };

  return (
    <>
       <main className="w-full h-screen flex justify-center items-center space-y-4">
       <div className="w-96 p-6 rounded-xl border shadow-md">
       <h2 className="text-xl font-bold text-center mb-4">Request Password Reset</h2>
      <div>
            <label className="text-base font-semibold flex item-center mr-4-auto">Email</label>
            <input
              type="email"
              required
              value={email}
              placeholder="Enter email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md outline-none focus:border-indigo-600"
            />
      </div>
      <button onClick={handleRequest}  className="w-full px-4 py-2 text-white font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 mt-4">Request Reset</button>
      <div className="text-center mt-4 text-sm">
          <Link to="/login" className="text-indigo-600 underline">
            Back to Login
          </Link>
        </div>
      

      {tokenInfo && (
        <ResetForm userId={tokenInfo.user_id} token={tokenInfo.reset_token} />
      )}

      </div>
      </main>
    </>
  );
}
export default ForgotPassword;