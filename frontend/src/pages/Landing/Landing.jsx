import { useEffect, useState } from "react";

import api from "../../services/api";
import Navbar from "../../components/Landing/Navbar";
import Hero from "../../components/Landing/Hero";
import DashboardShowcase from "../../components/Landing/DashboardShowcase";
import Features from "../../components/Landing/Features";
import Technologies from "../../components/Landing/Technologies";
import About from "../../components/Landing/About";
import Footer from "../../components/Landing/Footer";

function Landing() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/").then((response) => {
      setMessage(response.data.status);
    });
  }, []);

  return (
    <div style={{ backgroundColor: "var(--rx-bg)", minHeight: "100vh" }}>
      <Navbar />
      <Hero message={message} />
      <DashboardShowcase />
      <Features />
      <Technologies />
      <About />
      <Footer />
    </div>
  );
}


export default Landing;
