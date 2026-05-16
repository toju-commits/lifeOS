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
      className={className}
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
