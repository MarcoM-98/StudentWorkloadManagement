import OverloadBanner from "@/components/OverloadBanner";

export default function Home() {
  return (
    <main className="p-6">
      <OverloadBanner />
      <h1 className="text-2xl font-bold mt-6">Enchiladas</h1>
      <p className="text-sm opacity-80">Testing overload banner…</p>
    </main>
  );
}
