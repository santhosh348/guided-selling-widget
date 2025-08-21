import React from "react";
import GuidedSellingWidget from "@/components/GuidedSellingWidget";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 bg-neutral-50">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Guided Selling Widget — Demo PDP</h1>
        <GuidedSellingWidget
          product={{
            title: "ErgoPro Task Chair",
            sku: "CHAIR-EP-200",
            description: "Ergonomic chair with adjustable lumbar support, mesh back, and 4D armrests.",
            features: [
              "Weight capacity: 180 kg",
              "Adjustable lumbar support",
              "4D armrests",
              "Breathable mesh"
            ],
            specs: {
              material: "Mesh + Steel",
              weightCapacity: "180 kg",
              warranty: "2 years"
            }
          }}
          faqs={[
            { q: "What is the weight capacity?", a: "It supports up to 180 kg." },
            { q: "Does it have lumbar support?", a: "Yes, adjustable lumbar support is included." },
            { q: "What’s the warranty?", a: "2-year limited warranty." },
            { q: "Is assembly required?", a: "Yes, basic assembly is required (tools included)." },
            { q: "Does it squeak?", a: "No, it’s designed with noise-minimizing components." }
          ]}
          enableWebSearch={true}
        />
      </div>
    </main>
  );
}
