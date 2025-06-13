// components/UI/Logo.tsx
import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <h1 className={`font-bold ${sizeClasses[size]}`}>
      <span className="mr-2">🌱</span> {/* or use a custom icon */}
      <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
        FoodBridge
      </span>
    </h1>
  );
};

export default Logo;
