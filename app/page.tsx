import { Hero } from "@/components/pages/hero";
import { Features } from "@/components/pages/Features";
import { HowItWorks } from "@/components/pages/HowItWorks";
import { Footer } from "@/components/pages/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </main>
  );
}
