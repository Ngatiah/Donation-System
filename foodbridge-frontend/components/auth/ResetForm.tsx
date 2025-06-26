// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";

// interface ResetFormProps {
//   userId: number;
//   token: string;
// }

// const ResetForm: React.FC<ResetFormProps> = ({ userId, token }) => {
//   const [newPassword, setNewPassword] = useState('');
//   const navigate = useNavigate()

//   const handleReset = async () => {
//     const res = await fetch('http://localhost:8003/FoodBridge/donations/reset-password/', {
//       method: 'POST',
//       body: JSON.stringify({ user_id: userId, token, new_password: newPassword }),
//       headers: { 'Content-Type': 'application/json' }
//     });

//     const data = await res.json();
//     if (res.ok) {
//       toast.success("Password reset successful!");
//       navigate('/login')

//     } else {
//       alert(data.error || "Reset failed.");
//     }
//   };

//   return (
//     <>
//       <input
//         type="password"
//         value={newPassword}
//         onChange={e => setNewPassword(e.target.value)}
//         placeholder="New Password"
//       />
//       <button onClick={handleReset}>Reset Password</button>
//     </>
//   );
// };

// export default ResetForm;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, ArrowRight } from "lucide-react";

interface ResetFormProps {
  userId: number;
  token: string;
}

const ResetForm: React.FC<ResetFormProps> = ({ userId, token }) => {
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    const res = await fetch(
      "http://localhost:8003/FoodBridge/donations/reset-password/",
      {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          token,
          new_password: newPassword,
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await res.json();
    if (res.ok) {
      toast.success("Password reset successful!");
      navigate("/login");
    } else {
      alert(data.error || "Reset failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Lock className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600">
            Create a new secure password for your account
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all shadow-md hover:shadow-lg"
          >
            <span>Reset Password</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetForm;
