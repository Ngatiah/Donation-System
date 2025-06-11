import React, { useState } from "react";
import ResetForm from "./ResetForm";

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
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter email"
      />
      <button onClick={handleRequest}>Request Reset</button>

      {tokenInfo && (
        <ResetForm userId={tokenInfo.user_id} token={tokenInfo.reset_token} />
      )}
    </>
  );
}
export default ForgotPassword;