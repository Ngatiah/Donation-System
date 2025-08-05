// import React, { useState } from "react";
// import DonationForm from "../UI/forms/DonationForm";
// import { postDonations } from "../lib/actions/donations";
// import { useAuthStore } from "../../store/authStore";
// import { donationSchema } from "../lib/validation";

// const Donate: React.FC = () => {
//   const token = useAuthStore.getState().token;
//   const [showModal, setShowModal] = useState(false);

//   return (
//     <div>
//       <button
//         onClick={() => setShowModal(true)}
//         className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//       >
//         Add Donation
//       </button>
//       {showModal && (
//         <DonationForm
//           type="DONATION"
//           schema={donationSchema}
//           isModal
//           onCancel={() => setShowModal(false)}
//           defaultValues={{
//             food_type: "",
//             quantity: 0,
//             expiry_date: new Date(),
//             // image :'',
//             image: "/images/download (1).jpeg",
//             // time_range: {
//             //   from: "",
//             //   until: "",
//             //   label: "",
//             // },
//             food_description: "",
//           }}
//           // onSubmit={(formData) => {
//           //   const cleanData = {
//           //     ...formData,
//           //     expiry_date: formData.expiry_date.toISOString().split("T")[0],
//           //   };
//           //   return postDonations(cleanData, token);
//           //   // return postDonations(formData, token);

//           //  }}
//           onSubmit={async (formData) => {
//             const formDataToSend = new FormData();
//             formDataToSend.append("food_type", formData.food_type);
//             formDataToSend.append("quantity", String(formData.quantity));
//             formDataToSend.append(
//               "expiry_date",
//               formData.expiry_date.toISOString().split("T")[0]
//             );
//             formDataToSend.append(
//               "food_description",
//               formData.food_description || ""
//             );

//             // For static image URL
//             if (typeof formData.image === "string") {
//               const imageUrl = formData.image.startsWith("/")
//                 ? `${window.location.origin}${formData.image}`
//                 : formData.image;
//               formDataToSend.append("image_url", imageUrl);
//             }
//             const response = await postDonations(formDataToSend, token);
//             setShowModal(false);
//             return response;
//           }}
//         />
//       )}
//       ;
//     </div>
//   );
// };
// export default Donate;

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DonationForm from "../UI/forms/DonationForm";
import { postDonations } from "../lib/actions/donations";
import { useAuthStore } from "../../store/authStore";
import { donationSchema } from "../lib/validation";

const Donate: React.FC = () => {
  const token = useAuthStore.getState().token;
  const navigate = useNavigate();

  // Automatically close modal and go back
  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  const handleSubmit = async (formData: any) => {
    const formDataToSend = new FormData();
    formDataToSend.append("food_type", formData.food_type);
    formDataToSend.append("quantity", String(formData.quantity));
    formDataToSend.append(
      "expiry_date",
      formData.expiry_date.toISOString().split("T")[0]
    );
    formDataToSend.append("food_description", formData.food_description || "");

    // For static image URL
    if (typeof formData.image === "string") {
      const imageUrl = formData.image.startsWith("/")
        ? `${window.location.origin}${formData.image}`
        : formData.image;
      formDataToSend.append("image_url", imageUrl);
    }

    const response = await postDonations(formDataToSend, token);
    navigate(-1); // Navigate back after successful submission
    return response;
  };

  return (
    <div className="bg-transparent">
      <DonationForm
        type="DONATION"
        schema={donationSchema}
        isModal
        onCancel={handleCancel}
        defaultValues={{
          food_type: "",
          quantity: 0,
          expiry_date: new Date(),
          image: "/images/download (1).jpeg",
          food_description: "",
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Donate;
