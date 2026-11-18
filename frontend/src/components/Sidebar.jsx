import React from 'react';
import { Sparkles, Sun, Moon } from 'lucide-react';

export default function Sidebar({ isDarkMode, toggleTheme, onSelectPlanner }) {
  return (
    <aside className="app-sidebar-nav">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <img
            src="/logo.png"
            alt="Dream travel agency Logo"
            className="sidebar-logo-img"
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Dream travel agency</span>
            <span className="sidebar-brand-subtitle">Ai-agent</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav-links">
          <button
            type="button"
            className="sidebar-nav-item active"
            onClick={onSelectPlanner}
          >
            <Sparkles size={16} />
            <span>AI Trip Planner</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Theme Toggle & Domestic India */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-theme-toggle-btn"
          onClick={toggleTheme}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          <span className="theme-toggle-label">
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
        <div className="sidebar-footer-caption">Domestic India</div>
      </div>
    </aside>
  );
}
