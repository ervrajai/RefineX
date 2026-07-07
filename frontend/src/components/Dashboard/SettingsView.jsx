import React, { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

function SettingsView({ user, loading }) {
  const [themeMode, setThemeMode] = useState("auto");

  // Load current theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "auto";
    setThemeMode(savedTheme);
  }, []);

  const changeTheme = (mode) => {
    setThemeMode(mode);
    localStorage.setItem("theme", mode);
    
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
    } else {
      // Auto (System preference)
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Google, GitHub, or Email/Password Icon Render
  const getProviderIcon = (provider) => {
    switch (provider) {
      case "google":
        return (
          <div className="p-1.5 rounded-lg bg-white/20 border border-white/20 flex items-center justify-center shrink-0" title="Google Integration">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
        );
      case "github":
        return (
          <div className="p-1.5 rounded-lg bg-white/20 border border-white/20 flex items-center justify-center shrink-0" title="GitHub Integration">
            <svg className="w-4.5 h-4.5 text-white fill-white" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </div>
        );
      case "email":
      default:
        return (
          <div className="p-1.5 rounded-lg bg-white/20 border border-white/20 flex items-center justify-center shrink-0" title="Email Account">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl w-full font-sans select-none animate-fade-in text-slate-900 dark:text-white">
      
      {/* Unique Branded Profile Card (342px x 184px) containing all specifications */}
      <div className="w-full min-h-[184px] relative p-6 text-white flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-[#5936B4] to-[#362A84] border border-white/10 shadow-lg shrink-0 select-none group transform-gpu transition-all duration-350 hover:scale-[1.01]">
        
        {/* Background cloud SVG overlay */}
        <div className="absolute right-0 top-[-12px] h-[120px] pointer-events-none opacity-20">
          <svg className="h-[120px] w-auto" viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M100 80C110 50 140 40 160 60C180 40 210 60 210 90C210 110 190 120 170 120H90C60 120 60 90 90 80Z" 
              fill="white" 
              fillOpacity="0.08"
            />
            <path 
              d="M40 50C50 20 80 10 100 30C120 10 150 30 150 60C150 80 130 90 110 90H30C0 90 0 60 30 50Z" 
              fill="white" 
              fillOpacity="0.05"
            />
          </svg>
        </div>

        {/* Card Header: User Identity & Edit trigger */}
        <div className="flex items-start justify-between z-10">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">Full Name</span>
            <span className="text-xl font-extrabold tracking-tight truncate max-w-[210px]">
              {loading ? "..." : (user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : "User")}
            </span>
          </div>

          {/* Edit Profile Button - visible and styled inside the card */}
          <button 
            title="Edit Profile" 
            className="p-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 text-white transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center active:scale-[0.96] shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform-gpu"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
        </div>

        {/* Card Middle: Email & Auth Method Icon */}
        <div className="flex items-center justify-between z-10">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">Email</span>
            <span className="text-xs font-semibold text-white/85 truncate max-w-[240px]">{loading ? "..." : user?.email}</span>
          </div>

          {/* Provider Integration Icon */}
          {!loading && getProviderIcon(user?.auth_provider)}
        </div>

        {/* Card Footer: Registration Date & Verification Status */}
        <div className="flex items-end justify-between z-10 border-t border-white/10 pt-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/50">Member Since</span>
            <span className="text-[10px] font-bold text-white/90">{loading ? "..." : formatDate(user?.date_joined)}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
              user?.is_email_verified 
                ? "bg-emerald-500/25 border-emerald-500/30 text-emerald-350"
                : "bg-amber-500/25 border-amber-500/30 text-amber-350"
            }`}>
              {user?.is_email_verified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>

      </div>

      {/* Theme preferences setting card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-zinc-800/80 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 mb-1">
          <Moon className="w-4 h-4 text-primary" strokeWidth={2.2} />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Theme Settings</h3>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-6">Customize the interface color scheme according to your preferences.</p>

        {/* Theme select controls */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-zinc-900/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-zinc-850 max-w-md">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "auto", label: "Auto", icon: Monitor },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = themeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => changeTheme(mode.id)}
                className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-[0_2px_8px_rgba(103,58,183,0.3)] border border-primary"
                    : "text-slate-655 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-zinc-850/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.2} shapeRendering="geometricPrecision" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
