// // components/UI/Logo.tsx
// import React from "react";

// interface LogoProps {
//   size?: "sm" | "md" | "lg";
//   className?: string;
// }

// const Logo: React.FC<LogoProps> = ({ size = "md" }) => {
//   const sizeClasses = {
//     sm: "text-xl",
//     md: "text-2xl",
//     lg: "text-3xl",
//   };

//   return (
//     <h1 className={`font-bold ${sizeClasses[size]} flex`}>
//       {/* <span className="mr-2">🌱</span> or use a custom icon */}
//       <img src="/images/aa54a6d26af307d18806b740bef98629.jpg" alt="logoImg" width={75} height={75} className="object-cover rounded-full"/>
//       <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
//         FoodBridge
//       </span>
//     </h1>
//   ); 
// };

// export default Logo;


// components/UI/Logo.tsx
import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <h1 className={`font-bold ${sizeClasses[size]}`}>
      {/* <span className="mr-2">🌱</span> or use a custom icon */}
      <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent py-4">
        FoodBridge
      </span>
    </h1>
  );
};

export default Logo;