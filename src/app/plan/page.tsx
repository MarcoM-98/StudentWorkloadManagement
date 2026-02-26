import OverloadBanner from "@/components/OverloadBanner";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Workload Dashboard
      </h1>

      <OverloadBanner />

      <p className="mt-6 text-gray-600">
        This page displays overload status based on assignments and availability.
      </p>
    </main>
  );
}
