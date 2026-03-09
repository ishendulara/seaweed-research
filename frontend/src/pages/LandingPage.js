import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';


import heroImage from '../assets/images/seaweed1.jpg';
import redSeaweed from '../assets/images/seaweed2.jpg';
import greenSeaweed from '../assets/images/seaweed3.jpg';

const LandingPage = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredVariety, setHoveredVariety] = useState(null);

  const services = [
    {
      icon: (
        <svg className="service-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Food Suggestions',
      desc: 'Get personalized seaweed recipes with detailed ingredients, preparation methods, and nutritional information tailored to your preferences.',
      colorClass: 'teal',
      bgClass: 'bg-teal'
    },
    {
      icon: (
        <svg className="service-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI Prescription',
      desc: 'Advanced AI-powered nutritional calculator to determine optimal seaweed intake based on your health goals and dietary requirements.',
      colorClass: 'blue',
      bgClass: 'bg-blue'
    },
    {
      icon: (
        <svg className="service-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      title: 'Packaging & Delivery',
      desc: 'Efficient packaging and delivery preparation system ensuring fresh seaweed products reach you in perfect condition.',
      colorClass: 'purple',
      bgClass: 'bg-purple'
    }
  ];

  
  const varieties = [
    {
      name: 'Kappaphycus Alvarezii',
      desc: 'Rich in carrageenan, this red seaweed variety is known for its excellent gelling properties and high nutritional value. Perfect for various culinary applications.',
      image: redSeaweed,  
      tags: ['High Fiber', 'Rich in Minerals', 'Antioxidants']
    },
    {
      name: 'Gracilaria Edulis',
      desc: 'A versatile green seaweed packed with essential nutrients and minerals. Widely used in Asian cuisine for its unique texture and health benefits.',
      image: greenSeaweed,  
      tags: ['Protein Rich', 'Vitamins', 'Low Calorie']
    }
  ];

  return (
    <div className="landing-page">
      {/* NAVBAR */}
      <header className="navbar">
        <nav className="nav-container">
          <div className="nav-brand">
            <div className="brand-logo">
              <svg className="logo-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C10.35 2 9 3.35 9 5c0 1.13.61 2.11 1.5 2.65V9.5c-.89.54-1.5 1.52-1.5 2.65 0 1.13.61 2.11 1.5 2.65v1.85c-.89.54-1.5 1.52-1.5 2.65 0 1.65 1.35 3 3 3s3-1.35 3-3c0-1.13-.61-2.11-1.5-2.65V16.8c.89-.54 1.5-1.52 1.5-2.65 0-1.13-.61-2.11-1.5-2.65V9.65c.89-.54 1.5-1.52 1.5-2.65 0-1.65-1.35-3-3-3z"/>
              </svg>
            </div>
            <span className="brand-name">SeaweedAI</span>
          </div>
          
          <div className="nav-links">
            <a href="#home" className="nav-link">Home</a>
            <a href="#prescription" className="nav-link">About US</a>
            {/* <Link to="/login" className="nav-link">Food Suggestions</Link> */}
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Smart Seaweed
              <br />
              <span className="title-gradient">Nutrition & Delivery</span>
            </h1>
            
            <p className="hero-text">
              Discover personalized seaweed recipes with AI-powered nutritional guidance. 
              From packaging to delivery, we make healthy eating simple and sustainable.
            </p>
            
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary">Get Started</Link>
              <Link to="login" className="btn-secondary">Explore Recipes</Link>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="hero-image-container">
              <img 
                src={heroImage}
                alt="Fresh seaweed"
                className="hero-image"
              />
              <div className="image-overlay"></div>
            </div>
            <div className="glow-effect glow-1"></div>
            <div className="glow-effect glow-2"></div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="suggestions" className="services-section">
        <div className="services-container">
          <div className="section-header">
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">Complete seaweed solution from farm to table</p>
          </div>
          
          <div className="services-grid">
            {services.map((service, idx) => (
              <div
                key={idx}
                className={`service-card ${service.bgClass} ${hoveredFeature === idx ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredFeature(idx)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`service-icon-wrapper ${service.colorClass}`}>
                  {service.icon}
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-desc">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEAWEED VARIETIES SECTION */}
      <section className="varieties-section">
        <div className="varieties-container">
          <div className="section-header">
            <h2 className="section-title">Our Seaweed Varieties</h2>
            <p className="section-subtitle">Premium quality seaweed for optimal nutrition</p>
          </div>
          
          <div className="varieties-grid">
            {varieties.map((variety, idx) => (
              <div
                key={idx}
                className={`variety-card ${hoveredVariety === idx ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredVariety(idx)}
                onMouseLeave={() => setHoveredVariety(null)}
              >
                <div className="variety-image-wrapper">
                  <img 
                    src={variety.image}
                    alt={variety.name}
                    className="variety-image"
                  />
                  <div className="variety-image-overlay"></div>
                </div>
                <div className="variety-content">
                  <h3 className="variety-name">{variety.name}</h3>
                  <p className="variety-desc">{variety.desc}</p>
                  <div className="variety-tags">
                    {variety.tags.map((tag, tagIdx) => (
                      <span key={tagIdx} className="variety-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <div className="cta-gradient"></div>
            <div className="cta-content">
              <h2 className="cta-title">
                Ready to Start Your Healthy Journey?
              </h2>
              <p className="cta-text">
                Join thousands of users discovering the benefits of seaweed-based nutrition
              </p>
              <Link to="/register" className="btn-cta">Create Free Account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <svg className="logo-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C10.35 2 9 3.35 9 5c0 1.13.61 2.11 1.5 2.65V9.5c-.89.54-1.5 1.52-1.5 2.65 0 1.13.61 2.11 1.5 2.65v1.85c-.89.54-1.5 1.52-1.5 2.65 0 1.65 1.35 3 3 3s3-1.35 3-3c0-1.13-.61-2.11-1.5-2.65V16.8c.89-.54 1.5-1.52 1.5-2.65 0-1.13-.61-2.11-1.5-2.65V9.65c.89-.54 1.5-1.52 1.5-2.65 0-1.65-1.35-3-3-3z"/>
                  </svg>
                </div>
                <span className="footer-brand-name">SeaweedAI</span>
              </div>
              <p className="footer-brand-desc">
                Smart nutrition solutions powered by AI technology
              </p>
            </div>
            
            <div className="footer-col">
              <h5 className="footer-col-title">Quick Links</h5>
              <div className="footer-links">
                <a href="#" className="footer-link">Home</a>
                <a href="#" className="footer-link">Food Suggestions</a>
                <a href="#" className="footer-link">Login</a>
              </div>
            </div>
            
            <div className="footer-col">
              <h5 className="footer-col-title">Services</h5>
              <div className="footer-links">
                <a href="#" className="footer-link">AI Prescription</a>
                <a href="#" className="footer-link">Packaging & Delivery</a>
                <a href="#" className="footer-link">Nutritional Guidance</a>
              </div>
            </div>
            
            <div className="footer-col">
              <h5 className="footer-col-title">Contact</h5>
              <div className="footer-contact">
                <p>support@seaweedai.com</p>
                <p>+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© 2025 SeaweedAI. All rights reserved. | Powered by Readdy</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;