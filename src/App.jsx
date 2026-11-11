import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import About from './components/About';
import Tech from './components/Tech';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import CookieConsent from './components/CookieConsent';

// Section order follows the original site: light hero and Overview, dark
// Technologies and Projects, light Experience, dark Contact, light footer.
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-eerieBlack focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Tech />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
      <FloatingButtons />
      <CookieConsent />
    </MotionConfig>
  );
}
