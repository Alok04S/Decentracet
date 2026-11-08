import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../common/Navbar";
import { Sidebar } from "../common/Sidebar";

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
