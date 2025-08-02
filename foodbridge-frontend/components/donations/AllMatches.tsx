
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { Plus } from "lucide-react";

interface Profile {
  role: string;
  donor_name: string;
  recipient_name: string;
  required_food_type?: string;
  required_quantity?: number;
}

interface DonationMatch {
  id: number;
  donor_name: string;
  recipient_name: string;
  food_type: string;
  matched_quantity: number;
  food_description: string;
  expiry_date: string;
  created_at: string;
  is_claimed: boolean;
  is_donation_deleted?: boolean;
}

interface RecipientMatchesProps {
  profile: Profile;
  initialMatches: DonationMatch[];
  onClaimSuccess: (claimedMatchId: number) => void;
}

const AllMatches: React.FC<RecipientMatchesProps> = ({
  profile,
  initialMatches,
  onClaimSuccess,
}) => {
  const [matches, setMatches] = useState<DonationMatch[]>(initialMatches);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false);
  const [noMatchesMessage, setNoMatchesMessage] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  // Update matches when initialMatches prop changes
  useEffect(() => {
    setMatches(initialMatches);
    if (initialMatches.length > 0) {
      setNoMatchesMessage(null);
    }
  }, [initialMatches]);

  // Set initial message if no matches
  useEffect(() => {
    if (!initialMatches.length && !noMatchesMessage && !isGeneratingMatches) {
      setNoMatchesMessage(
        "No available donations found matching your criteria at this time."
      );
    }
  }, [initialMatches, noMatchesMessage, isGeneratingMatches]);

  const claimDonation = async (matchId: number) => {
    if (!token) {
      toast.error("You must be logged in to claim a donation.");
      return;
    }

    try {
      setClaimingId(matchId);
      const response = await fetch(
        `http://localhost:8003/FoodBridge/donations/matches/${matchId}/claim/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Donation successfully claimed!");
        setMatches((prevMatches) =>
          prevMatches
            .map((match) =>
              match.id === matchId ? { ...match, is_claimed: true } : match
            )
            .filter((match) => !match.is_claimed)
        );
        onClaimSuccess(matchId);
      } else {
        toast.error(
          data?.detail || data?.message || "Failed to claim donation"
        );
      }
    } catch (err) {
      console.error("Claim donation error:", err);
      toast.error("An unexpected error occurred while claiming donation.");
    } finally {
      setClaimingId(null);
    }
  };

  const generateNewMatches = async () => {
    if (!token || !profile || profile.role !== "recipient") return;

    setIsGeneratingMatches(true);
    setNoMatchesMessage(null);

    try {
      if (!profile.required_food_type || !profile.required_quantity) {
        toast.error(
          "Please set your required food type and quantity in your profile."
        );
        return;
      }

      const quantityToSend =
        typeof profile.required_quantity === "string"
          ? parseFloat(profile.required_quantity)
          : profile.required_quantity;

      const matchRes = await fetch(
        "http://localhost:8003/FoodBridge/donations/donation-matches/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            recipient_food_type: profile.required_food_type,
            required_quantity: quantityToSend,
          }),
        }
      );

      const fetchedMatches = await matchRes.json();

      if (!matchRes.ok) {
        const message =
          fetchedMatches?.message || "Failed to generate new matches.";
        setNoMatchesMessage(message);
        toast.error(message);
      } else {
        const newMatches: DonationMatch[] = fetchedMatches.matches || [];

        setMatches((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = newMatches.filter((m) => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });

        if (newMatches.length > 0) {
          toast.success(`Found ${newMatches.length} new matches!`);
        } else {
          const message = "No new matches found based on your criteria.";
          setNoMatchesMessage(message);
          toast.error(message);
        }
      }
    } catch (err) {
      console.error("Generate matches error:", err);
      toast.error("An error occurred while searching for matches.");
    } finally {
      setIsGeneratingMatches(false);
    }
  };

  // Filter out claimed donations
  const unclaimedMatches = matches.filter((match) => !match.is_claimed);

  return (
    <div className="space-y-4">
      {profile.role === "recipient" && (
        <div className="flex justify-end">
          <button
            onClick={generateNewMatches}
            disabled={isGeneratingMatches}
            className={`flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors ${
              isGeneratingMatches ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isGeneratingMatches ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Searching...
              </>
            ) : (
              <>
                Find New Donations <Plus className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      )}

      {unclaimedMatches.length > 0 ? (
        <div 
         className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}
        // className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        // className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {unclaimedMatches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-md shadow-lg text-left p-4 w-auto h-auto"
            >
              <div className="">
                <div className="overflow-hidden rounded-lg mb-2">
                  <img
                    src="/images/download (1).jpeg" 
                    alt={match.food_type}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {match.food_type}
                </h3>

                <div className="space-y-1 text-base text-gray-600">
                  <p>
                    <span className="font-medium">From:</span>{" "}
                    {match.donor_name}
                  </p>

                  {/* <p>
                    <span className="font-medium">Quantity:</span>{" "}
                    {match.matched_quantity} kg
                  </p> */}

                  {match.food_description && (
                    <p className="italic">
                      <span className="font-medium">Details:</span>{" "}
                      {match.food_description}
                    </p>
                  )}

                  {/* <p>
                    <span className="font-medium">Expires:</span>{" "}
                    {/* {new Date(match.expiry_date).toLocaleDateString()} */}
                  {/* </p> */} 
                </div>

                <button
                  onClick={() => claimDonation(match.id)}
                  disabled={match.is_claimed || claimingId === match.id}
                  className={`mt-3 w-full py-2 rounded-md text-white font-medium transition-colors ${
                    match.is_claimed || claimingId === match.id
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {claimingId === match.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : match.is_claimed ? (
                    "Claimed"
                  ) : (
                    "Claim Donation"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
       

        <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
             { noMatchesMessage || 'No Available Donations'}
            </h3>
           {profile.role === 'recipient' && <p className="text-gray-600 max-w-md mx-auto">
              Click the "Find New Donations" button for any updates
            </p>}
          </div>

        // <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-600">
        //   <p className="text-lg">
        //     {noMatchesMessage ||
        //       "No available donations matching your criteria."}
        //   </p>
        //   {profile.role === "recipient" && (
        //     <p className="mt-2 text-sm">
        //       Click "Find New Donations" to search again
        //     </p>
        //   )}
        // </div>

      )}
    </div>
  );
};

export default AllMatches;
