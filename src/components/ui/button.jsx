import React from "react";

const sizeClasses = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-8"
};

const variantClasses = {
  default: "border border-transparent",
  outline: "border"
};

const Button = React.forwardRef(
  ({ className = "", variant = "default", size = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size] || sizeClasses.default,
        variantClasses[variant] || variantClasses.default,
        className
      ].join(" ")}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
