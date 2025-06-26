
import React, { useState } from "react";
import ResetForm from "./ResetForm";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

interface TokenInfo {
  user_id: number;
  reset_token: string;
}

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRequest = async () => {
    if (!email) {
      setMessage("Please enter your email");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        "http://localhost:8003/FoodBridge/donations/request-password-reset/",
        {
          method: "POST",
          body: JSON.stringify({ email }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setTokenInfo(data);
        setEmail(""); // Clear email field
        setShowSuccess(true);
        setMessage("Reset instructions sent to your email!");
      } else {
        setMessage("User not found. Please check your email.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenInfo) {
    return (
      <ResetForm userId={tokenInfo.user_id} token={tokenInfo.reset_token} />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {showSuccess ? "Check Your Email" : "Forgot Password"}
          </h2>
          <p className="text-gray-600">
            {showSuccess
              ? "We've sent instructions to your email"
              : "Enter your email to receive reset instructions"}
          </p>
        </div>

        {showSuccess ? (
          <div className="text-center">
            <div className="mx-auto flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <p className="text-gray-700 mb-6">
              If an account exists for {email}, you'll receive an email with
              password reset instructions.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Didn't receive it? Try again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  placeholder="your@email.com"
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleRequest()}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes("sent")
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              onClick={handleRequest}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {isLoading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                <>
                  <span>Request Reset Link</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ForgotPassword;
