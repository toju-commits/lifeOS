import React from "react";

const TabsContext = React.createContext(null);

function Tabs({ value, defaultValue, onValueChange, className = "", children, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value ?? internalValue;

  const setValue = React.useCallback(
    (nextValue) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value]
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

const TabsList = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} role="tablist" className={className} {...props} />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ value, className = "", children, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  const selected = context?.value === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      className={[
        "inline-flex min-h-10 items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
        selected
          ? "border-emerald-300 bg-emerald-300 text-black shadow-[0_0_0_1px_rgba(110,231,183,0.55),0_0_22px_rgba(16,185,129,0.28)] ring-2 ring-emerald-300/45"
          : "border-current/20 bg-transparent text-current opacity-80 hover:opacity-100 hover:bg-current/10",
        className
      ].join(" ")}
      onClick={() => context?.setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ value, className = "", children, ...props }, ref) => {
  const context = React.useContext(TabsContext);

  if (context?.value !== value) {
    return null;
  }

  return (
    <div ref={ref} role="tabpanel" className={className} {...props}>
      {children}
    </div>
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsContent, TabsList, TabsTrigger };
