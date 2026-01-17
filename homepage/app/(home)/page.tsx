import styles from './landing.module.css';
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import OpenSource from "@/components/landing/OpenSource";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className={styles.landingPage}>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <OpenSource />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
