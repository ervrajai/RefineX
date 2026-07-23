import React, { useState, useEffect } from "react";
import { 
  User, 
  KeyRound, 
  Mail, 
  Sun, 
  Moon, 
  TvMinimal, 
  ShieldCheck, 
  LogOut, 
  Check, 
  AlertCircle, 
  Loader2,
  Lock,
  UserCheck
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";

function SettingsView({ user, loading, handleLogout }) {
  const [activeSubTab, setActiveSubTab] = useState("profile"); // profile, security, appearance
  const [themeMode, setThemeMode] = useState("auto");

  // Profile Form state
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.profile_picture || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password Form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: "", text: "" });

  // Email Update OTP state
  const [newEmail, setNewEmail] = useState("");
  const [emailOtpStep, setEmailOtpStep] = useState(1); // 1: request, 2: verify
  const [otpCode, setOtpCode] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setUsername(user.username || (user.email ? user.email.split("@")[0] : ""));
      setAvatar(user.profile_picture || "");
    }
  }, [user]);

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
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  // 1. Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ type: "", text: "" });

    try {
      await api.patch("accounts/profile/", {
        first_name: firstName,
        last_name: lastName,
        username: username,
        profile_picture: avatar,
        avatar: avatar
      });
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to update profile.";
      setProfileMsg({ type: "error", text: detail });
    } finally {
      setProfileSaving(false);
    }
  };

  // 2. Change Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassSaving(true);
    setPassMsg({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "New passwords do not match." });
      setPassSaving(false);
      return;
    }

    try {
      await api.post("accounts/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPassMsg({ type: "success", text: "Password changed successfully!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to change password.";
      setPassMsg({ type: "error", text: detail });
    } finally {
      setPassSaving(false);
    }
  };

  // 3. Request Email Update OTP
  const handleRequestEmailOtp = async (e) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg({ type: "", text: "" });

    try {
      await api.post("accounts/email/request-otp/", {
        new_email: newEmail,
      });
      setEmailOtpStep(2);
      setEmailMsg({ type: "success", text: `Verification OTP sent to ${newEmail}` });
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to send OTP.";
      setEmailMsg({ type: "error", text: detail });
    } finally {
      setEmailSaving(false);
    }
  };

  // 4. Verify Email Update OTP
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg({ type: "", text: "" });

    try {
      await api.post("accounts/email/verify-update/", {
        new_email: newEmail,
        otp: otpCode,
      });
      setEmailMsg({ type: "success", text: "Email updated and verified successfully!" });
      setEmailOtpStep(1);
      setNewEmail("");
      setOtpCode("");
    } catch (err) {
      const detail = err.response?.data?.detail || "Invalid or expired OTP.";
      setEmailMsg({ type: "error", text: detail });
    } finally {
      setEmailSaving(false);
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto font-sans select-none animate-fade-in text-slate-900 dark:text-white pb-10">
      
      {/* Settings Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Manage your personal details, security credentials, and application preferences.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Account & Security", icon: KeyRound },
            { id: "appearance", label: "Appearance", icon: Sun },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSelected ? "text-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="settings-tab"
                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-700"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: PROFILE SETTINGS */}
      {activeSubTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 flex flex-col gap-6 shadow-sm">
            
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Profile Information
            </h3>

            {profileMsg.text && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                profileMsg.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}>
                {profileMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {profileMsg.text}
              </div>
            )}

            {/* Avatar Input / Preview */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                {avatar ? (
                  <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Profile Picture / Avatar URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow transition duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>

          </div>
        </form>
      )}

      {/* SUB-TAB 2: ACCOUNT & SECURITY */}
      {activeSubTab === "security" && (
        <div className="flex flex-col gap-6">
          
          {/* Change Password Panel */}
          <form onSubmit={handlePasswordSubmit} className="p-6 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 flex flex-col gap-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" /> Change Password
            </h3>

            {passMsg.text && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                passMsg.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}>
                {passMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {passMsg.text}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={passSaving}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow transition duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {passSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </form>

          {/* Update Email with OTP Verification Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 flex flex-col gap-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" /> Update Email Address
            </h3>

            {emailMsg.text && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                emailMsg.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}>
                {emailMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {emailMsg.text}
              </div>
            )}

            <div className="text-xs text-slate-500 dark:text-zinc-400">
              Current Email: <span className="font-bold text-slate-900 dark:text-white">{user?.email}</span>
            </div>

            {emailOtpStep === 1 ? (
              <form onSubmit={handleRequestEmailOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">New Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="newemail@domain.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emailSaving}
                  className="self-end px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send OTP Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Enter 6-Digit OTP sent to {newEmail}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    required
                    placeholder="123456"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm font-bold tracking-widest text-center text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setEmailOtpStep(1)}
                    className="text-xs font-bold text-slate-500 hover:underline cursor-pointer"
                  >
                    Change Email Address
                  </button>
                  <button
                    type="submit"
                    disabled={emailSaving || otpCode.length !== 6}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Verify & Change Email
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      )}

      {/* SUB-TAB 3: APPEARANCE & SESSION */}
      {activeSubTab === "appearance" && (
        <div className="flex flex-col gap-6">
          
          {/* Theme Mode Selector */}
          <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Theme & Appearance</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              Customize the interface color scheme according to your preferences.
            </p>

            <div className="grid grid-cols-3 gap-2 bg-slate-100/80 dark:bg-zinc-900/80 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 w-full max-w-md">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "auto", label: "System Auto", icon: TvMinimal },
              ].map((mode) => {
                const Icon = mode.icon;
                const isSelected = themeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => changeTheme(mode.id)}
                    className={`relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer outline-none ${
                      isSelected ? "text-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="theme-outline"
                        className="absolute inset-0 bg-white dark:bg-zinc-800 border border-black/20 dark:border-white/20 rounded-lg shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{mode.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Logout Panel */}
          <div className="flex items-center justify-between p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-450 flex items-center gap-2">
                <LogOut className="w-5 h-5" /> Account Session
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Sign out of your active session on this browser.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition duration-200 flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default SettingsView;