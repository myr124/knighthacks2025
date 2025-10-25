import React from "react";

export default function HurricanePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-4">Hurricane Analysis</h1>
      <p className="text-lg text-gray-300 mb-8">Visualize and analyze hurricane data on a global scale.</p>
      {/* Add globe visualization or hurricane data components here */}
      <div className="w-full max-w-2xl bg-gray-900 rounded-lg p-6 shadow-lg">
        <p className="text-gray-400">No hurricane data loaded yet.</p>
      </div>
    </main>
  );
}
