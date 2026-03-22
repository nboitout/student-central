import { LanguageProvider } from "@/context/LanguageContext";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import DividerBar from "@/components/DividerBar";
import Problem from "@/components/Problem";
import Approach from "@/components/Approach";
import Workflow from "@/components/Workflow";
import Faculty from "@/components/Faculty";
import Pedagogy from "@/components/Pedagogy";
import Trust from "@/components/Trust";
import Institutional from "@/components/Institutional";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <LanguageProvider>
      <Nav />
      <main>
        <Hero />
        <DividerBar />
        <Problem />
        <Approach />
        <Workflow />
        <Faculty />
        <Pedagogy />
        <Trust />
        <Institutional />
        <CTA />
      </main>
      <Footer />
      <ScrollReveal />
    </LanguageProvider>
  );
}
