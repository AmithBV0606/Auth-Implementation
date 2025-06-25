import React from "react";
import { ThemeToggleButton } from "./theme-toggle-button";

export default function Navbar() {
  return (
    <div className="container mx-auto p-4 border-2 rounded-2xl mt-6">
      <ThemeToggleButton />
    </div>
  );
}
