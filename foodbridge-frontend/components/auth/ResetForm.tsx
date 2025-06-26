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
    <main className="w-full h-screen flex justify-center items-center">
      <div className="w-96 p-6 rounded-xl border shadow-md">
        <h2 className="text-xl font-bold text-center mb-4">Reset your password</h2>
    <div>
            <label className="text-base font-semibold flex item-center mr-4-auto">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New Password"
              required
              className="w-full mt-1 px-3 py-2 border rounded-md outline-none focus:border-indigo-600"
            />
      </div>
      <button onClick={handleReset}  className="w-full px-4 py-2 text-white font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 mt-4">Reset Password</button>
      </div>
      </main>
    </>
  );
};

export default ResetForm;
