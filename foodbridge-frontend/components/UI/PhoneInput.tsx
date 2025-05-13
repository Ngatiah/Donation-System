import * as React from "react";
import { cn } from "../lib/util";

interface PhoneInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, type = "tel", prefix = "+254", ...props }, ref) => {
    return (
      <div className="flex w-full items-center rounded-md border border-slate-200 shadow-sm dark:border-slate-800">
        <span className="px-3 text-gray-900 dark:text-gray-800 bg-slate-100 dark:bg-slate-600 border-r border-slate-200 dark:border-slate-700 text-sm select-none">
          {prefix}
        </span>
        <input
          ref={ref}
          type={type}
          {...props}
          className={cn(
            "flex-1 h-9 px-3 py-1 text-base border-0 bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 md:text-sm dark:text-gray",
            className
          )}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
