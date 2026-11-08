import React from "react";

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = "Loading data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3 text-secondary">
      <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
};
