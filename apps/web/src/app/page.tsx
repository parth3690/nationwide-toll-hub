/**
 * Elite Home Page Component
 * 
 * Landing page for the Nationwide Toll Hub web application
 * with hero section, features, and call-to-action.
 */

import { Metadata } from 'next';
import { HeroSection } from '@/components/sections/hero-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { StatsSection } from '@/components/sections/stats-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { CTASection } from '@/components/sections/cta-section';
import { PricingSection } from '@/components/sections/pricing-section';

export const metadata: Metadata = {
  title: 'Nationwide Toll Hub - Manage All Your Toll Payments',
  description: 'Unified platform to manage toll payments, view statements, and track expenses across all toll agencies nationwide. Secure, fast, and user-friendly.',
  keywords: ['toll management', 'toll payments', 'unified toll platform', 'toll statements', 'transportation expenses'],
  openGraph: {
    title: 'Nationwide Toll Hub - Manage All Your Toll Payments',
    description: 'Unified platform to manage toll payments, view statements, and track expenses across all toll agencies nationwide.',
    type: 'website',
  },
  twitter: {
    title: 'Nationwide Toll Hub - Manage All Your Toll Payments',
    description: 'Unified platform to manage toll payments, view statements, and track expenses across all toll agencies nationwide.',
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}
