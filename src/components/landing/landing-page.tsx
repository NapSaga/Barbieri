"use client";

import { ComparisonSection } from "./comparison-section";
import { CtaSection } from "./cta-section";
import { FaqSection } from "./faq-section";
import { Footer } from "./footer";
import { HeroSection } from "./hero-section";
import { Navbar } from "./navbar";
import { PricingSection } from "./pricing-section";
import { ProblemSection } from "./problem-section";
import { RoiSection } from "./roi-section";
import { SolutionSection } from "./solution-section";
import { WhatsAppSection } from "./whatsapp-section";

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <WhatsAppSection />
        <ComparisonSection />
        <RoiSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
