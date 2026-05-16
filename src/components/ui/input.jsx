import React from "react";

const Input = React.forwardRef(({ className = "", type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={[
      "flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors placeholder:text-current placeholder:opacity-55 disabled:cursor-not-allowed disabled:opacity-50",
      className
    ].join(" ")}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
