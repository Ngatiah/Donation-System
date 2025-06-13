import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// donation-matches status
export function getMatchStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Awaiting Response";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "fulfilled":
      return "Completed";
    case "auto_cancelled_by_system":
      return "Expired / Cancelled";
    default:
      return status;
  }
}

// donations status
export function getDonationStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Pending Matches";
    case "accepted":
      return "Accepted by Recipient";
    case "declined_by_recipient":
      return "Declined by Recipient";
    case "fulfilled":
      return "Donation Fulfilled";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}
