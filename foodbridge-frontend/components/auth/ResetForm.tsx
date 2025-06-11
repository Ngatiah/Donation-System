import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface ResetFormProps {
  userId: number;
  token: string;
}

const ResetForm: React.FC<ResetFormProps> = ({ userId, token }) => {
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate()

  const handleReset = async () => {
    const res = await fetch('http://localhost:8003/FoodBridge/donations/reset-password/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, token, new_password: newPassword }),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (res.ok) {
      toast.success("Password reset successful!");
      navigate('/login')

    } else {
      alert(data.error || "Reset failed.");
    }
  };

  return (
    <>
      <input
        type="password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        placeholder="New Password"
      />
      <button onClick={handleReset}>Reset Password</button>
    </>
  );
};

export default ResetForm;
