import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  KeyRound, 
  Sun, 
  Moon, 
  TvMinimal, 
  LogOut, 
  Check, 
  AlertCircle, 
  Loader2,
  Lock,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  X,
  Camera,
  Trash2,
  AlertTriangle,
  Pencil,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import PasswordChecklist from "../Auth/PasswordChecklist";
import OtpInput from "../Auth/OtpInput";
import { validatePassword } from "../../utils/passwordPolicy";
import { useAuth } from "../../context/AuthContext";

function SettingsView({ user, loading, handleLogout, onProfileUpdate }) {
  const navigate = useNavigate();
  const { setLoggedOut } = useAuth();
  const [themeMode, setThemeMode] = useState("auto");
  const [searchQuery, setSearchQuery] = useState("");

  // Profile Edit State & Validation
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAvatarUrlInput, setShowAvatarUrlInput] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.profile_picture || user?.avatar || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [profileFieldErrors, setProfileFieldErrors] = useState({});

  // Password Form State & Toggles
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOldPasswordVerified, setIsOldPasswordVerified] = useState(false);
  const [isVerifyingOldPass, setIsVerifyingOldPass] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: "", text: "" });
  const [passFieldErrors, setPassFieldErrors] = useState({});

  // Delete Account Danger Zone Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtpStep, setDeleteOtpStep] = useState(1); // 1: send otp / password, 2: verify otp
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteResendIn, setDeleteResendIn] = useState(0);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setUsername(user.username || (user.email ? user.email.split("@")[0] : ""));
      setAvatar(user.profile_picture || user.avatar || "");
    }
  }, [user]);

  // Cooldown timer for delete account OTP
  useEffect(() => {
    if (deleteResendIn <= 0) return undefined;
    const timer = setInterval(() => {
      setDeleteResendIn((sec) => Math.max(sec - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [deleteResendIn]);

  // Theme Sync logic matching older settings & landing page
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

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProviderIcon = (provider) => {
    const baseClasses = "p-2 rounded-xl bg-white/10 border border-white/30 flex items-center justify-center shrink-0 transition-colors duration-200 hover:bg-white/20 hover:border-white";
    
    switch (provider) {
      case "google":
        return (
          <div className={baseClasses} title="Google Integration">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
        );
      case "github":
        return (
          <div className={baseClasses} title="GitHub Integration">
            <svg className="w-5 h-5 text-white fill-white" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </div>
        );
      case "email":
      default:
        return (
          <div className={baseClasses} title="Email Account">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        );
    }
  };

  // Profile Form Validation & Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    setProfileFieldErrors({});

    const errors = {};
    if (!firstName.trim()) {
      errors.first_name = "First name is required.";
    }
    if (username.trim()) {
      if (username.length < 3) {
        errors.username = "Username must be at least 3 characters.";
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.username = "Username can only contain letters, numbers, and underscores.";
      }
    }
    if (avatar.trim() && !/^https?:\/\/.+/i.test(avatar.trim())) {
      errors.avatar = "Profile picture must be a valid URL starting with http:// or https://";
    }

    if (Object.keys(errors).length > 0) {
      setProfileFieldErrors(errors);
      setProfileMsg({ type: "error", text: "Please fix the validation errors below." });
      return;
    }

    setProfileSaving(true);

    try {
      const response = await api.patch("accounts/profile/", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        profile_picture: avatar.trim(),
        avatar: avatar.trim()
      });
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      setIsEditingProfile(false);
      setShowAvatarUrlInput(false);
      if (onProfileUpdate && response.data) {
        onProfileUpdate(response.data);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if (data.detail) {
          setProfileMsg({ type: "error", text: data.detail });
        } else {
          setProfileFieldErrors(data);
          setProfileMsg({ type: "error", text: "Failed to update profile. Check the errors below." });
        }
      } else {
        setProfileMsg({ type: "error", text: "Failed to update profile." });
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // Validate Old Password on Blur
  const handleOldPasswordBlur = async () => {
    if (!oldPassword.trim()) {
      setIsOldPasswordVerified(false);
      return;
    }
    setIsVerifyingOldPass(true);
    setPassFieldErrors((prev) => ({ ...prev, old_password: null }));
    try {
      await api.post("accounts/verify-password/", { password: oldPassword });
      setIsOldPasswordVerified(true);
      setPassFieldErrors((prev) => ({ ...prev, old_password: null }));
    } catch (err) {
      setIsOldPasswordVerified(false);
      const detail = err.response?.data?.detail || "Current password is incorrect.";
      setPassFieldErrors((prev) => ({ ...prev, old_password: detail }));
    } finally {
      setIsVerifyingOldPass(false);
    }
  };

  // Password Form Validation & Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassSaving(true);
    setPassMsg({ type: "", text: "" });
    setPassFieldErrors({});

    const errors = {};
    if (!oldPassword) {
      errors.old_password = "Current password is required.";
    } else if (!isOldPasswordVerified) {
      errors.old_password = "Current password is incorrect.";
    }

    if (!newPassword) {
      errors.new_password = "New password is required.";
    } else if (newPassword === oldPassword) {
      errors.new_password = "New password cannot be identical to your current password.";
    } else if (!validatePassword(newPassword)) {
      errors.new_password = "Password must be 8-15 characters with at least one uppercase letter and one special character.";
    }

    if (newPassword !== confirmPassword) {
      errors.confirm_password = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setPassFieldErrors(errors);
      setPassMsg({ type: "error", text: errors.new_password || errors.confirm_password || errors.old_password || "Please check password requirements." });
      setPassSaving(false);
      return;
    }

    try {
      await api.post("accounts/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPassMsg({ type: "success", text: "Password updated successfully!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsOldPasswordVerified(false);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if (data.detail) {
          setPassMsg({ type: "error", text: data.detail });
        } else {
          setPassFieldErrors(data);
          setPassMsg({ type: "error", text: "Failed to update password." });
        }
      } else {
        setPassMsg({ type: "error", text: "Failed to update password." });
      }
    } finally {
      setPassSaving(false);
    }
  };

  // Delete Account Request OTP (For Google / GitHub social users)
  const handleDeleteRequestOtp = async () => {
    setDeleteError("");
    setDeleteMsg("");
    setDeleteLoading(true);
    try {
      await api.post("accounts/delete-account/request-otp/");
      setDeleteMsg(`Verification OTP code sent to ${user?.email}`);
      setDeleteOtpStep(2);
      setDeleteResendIn(30);
    } catch (err) {
      if (err.response?.data?.retry_after) {
        setDeleteResendIn(err.response.data.retry_after);
      }
      setDeleteError(err.response?.data?.detail || "Could not send OTP code. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Confirm Account Deletion
  const handleDeleteAccountConfirm = async (e) => {
    e.preventDefault();
    setDeleteError("");
    setDeleteLoading(true);

    try {
      const payload = user?.auth_provider === "email" 
        ? { password: deletePassword }
        : { otp: deleteOtp };

      await api.post("accounts/delete-account/confirm/", payload);
      
      // Successfully deleted! Clear auth context and redirect to landing page
      if (setLoggedOut) {
        setLoggedOut();
      }
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.detail || "Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeletePassword("");
    setDeleteOtp("");
    setDeleteError("");
    setDeleteMsg("");
    setDeleteOtpStep(1);
  };

  // Search Filter Helper
  const query = searchQuery.trim().toLowerCase();
  const matchesSearch = (...keywords) => {
    if (!query) return true;
    return keywords.some((kw) => kw && kw.toLowerCase().includes(query));
  };

  const showAppearance = matchesSearch("appearance", "theme", "dark", "light", "mode", "color", "system auto");
  const showProfile = matchesSearch("profile", "name", "email", "avatar", "username", "picture", "first name", "last name", "edit profile", "user");
  const showUpdatePassword = matchesSearch("security", "password", "update password", "change password", "forgot password", "current password", "new password", "credentials");
  const showLogout = matchesSearch("logout", "log out", "sign out", "exit", "session");
  const showDelete = matchesSearch("delete", "danger", "danger zone", "delete account", "remove account", "erase", "permanent");

  const hasMatches = showAppearance || showProfile || showUpdatePassword || showLogout || showDelete;

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto font-sans select-none animate-fade-in text-slate-900 dark:text-white pb-10">
      
      {/* Settings Navigation Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage all your account preferences, profile details, security, and appearance settings in one place.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* No Search Matches Fallback */}
      {!hasMatches && (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-3 shadow-sm my-4">
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No settings found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            No settings match "<span className="font-bold">{searchQuery}</span>". Try searching for profile, appearance, password, or delete.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* SINGLE UNIFIED SETTINGS SEQUENCE */}
      
      {/* 1. APPEARANCE SECTION */}
      {showAppearance && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-5 h-5 text-primary" strokeWidth={2.2} />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance Mode</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
            Customize the interface color scheme according to your preferences.
          </p>

          <div className="grid grid-cols-3 gap-2 bg-slate-100/80 dark:bg-zinc-900/80 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 w-full sm:max-w-md transition-colors duration-300">
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
                  type="button"
                  onClick={() => changeTheme(mode.id)}
                  className={`relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-colors duration-300 outline-none select-none cursor-pointer ${
                    isSelected
                      ? "text-slate-950 dark:text-white"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {/* Active Dynamic Outline Background */}
                  {isSelected && (
                    <motion.div
                      layoutId="nav-outline"
                      className="absolute inset-0 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg shadow-sm"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  
                  {/* Content Container to Layer Above Absolute Animation */}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                    <span>{mode.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 2. PROFILE SECTION */}
      {showProfile && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          {/* Purple Profile Card (Matching Older Settings Design) */}
          <div className="relative flex flex-col justify-between w-full p-6 sm:p-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#5936B4] to-[#362A84] border border-black dark:border-white shrink-0 group transition-all duration-300 gap-6 shadow-md">
            
            {/* Background Graphic */}
            <div className="absolute right-0 top-[-10%] h-[120%] pointer-events-none opacity-20 transition-opacity duration-500 group-hover:opacity-40">
              <svg className="h-full w-auto" viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 80C110 50 140 40 160 60C180 40 210 60 210 90C210 110 190 120 170 120H90C60 120 60 90 90 80Z" fill="white" fillOpacity="0.08"/>
                <path d="M40 50C50 20 80 10 100 30C120 10 150 30 150 60C150 80 130 90 110 90H30C0 90 0 60 30 50Z" fill="white" fillOpacity="0.05"/>
              </svg>
            </div>

            {/* Top Row: Avatar & Full Name & Edit Toggle */}
            <div className="flex items-center justify-between w-full z-10 gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Bigger, High Quality Profile Picture Avatar */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border-2 border-white/30 overflow-hidden shrink-0 shadow-lg flex items-center justify-center backdrop-blur-md">
                  {user?.profile_picture || user?.avatar ? (
                    <img 
                      src={user?.profile_picture || user?.avatar} 
                      alt={user?.first_name || "Profile Avatar"} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {user?.first_name ? user.first_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : "U"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Full Name</span>
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                    {loading ? "..." : (user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : "User")}
                  </span>
                  {user?.username && (
                    <span className="text-xs font-semibold text-white/80 truncate">
                      @{user.username}
                    </span>
                  )}
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                title={isEditingProfile ? "Cancel Editing" : "Edit Profile"} 
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/30 text-white transition-all duration-200 hover:bg-white/20 hover:border-white shrink-0 cursor-pointer active:scale-95 text-xs font-bold shadow-sm"
              >
                {isEditingProfile ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isEditingProfile ? "Cancel" : "Edit Profile"}</span>
              </button>
            </div>

            {/* Middle Row: Email & Auth Provider */}
            <div className="flex items-center justify-between w-full z-10">
              <div className="flex flex-col gap-0.5 min-w-0 pr-4 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Email Address</span>
                <span className="text-sm sm:text-base font-medium text-white truncate">
                  {loading ? "..." : user?.email}
                </span>
              </div>
              {!loading && getProviderIcon(user?.auth_provider)}
            </div>

            {/* Footer Row: Member Since & Email Verification Status */}
            <div className="flex items-center justify-between w-full z-10 border-t border-white/20 pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Member Since</span>
                <span className="text-xs font-bold text-white">{loading ? "..." : formatDate(user?.date_joined)}</span>
              </div>

              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                user?.is_email_verified 
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-100"
                  : "bg-amber-500/20 border-amber-400 text-amber-100"
              }`}>
                {user?.is_email_verified ? "Verified" : "Unverified"}
              </span>
            </div>

          </div>

          {/* Edit Profile Panel (Shown when Edit button clicked) */}
          <AnimatePresence>
            {isEditingProfile && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleProfileSubmit} 
                className="overflow-hidden"
              >
                <div className="p-6 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 flex flex-col gap-5 shadow-sm">
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-primary" /> Edit Profile Details
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingProfile(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

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

                  {/* Profile Avatar Image Display with Pencil Overlay Icon */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="relative group/avatar cursor-pointer" onClick={() => setShowAvatarUrlInput(!showAvatarUrlInput)}>
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                        {avatar ? (
                          <img 
                            src={avatar} 
                            alt="Avatar Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-2xl font-black text-slate-400 dark:text-zinc-500">
                            {firstName ? firstName[0].toUpperCase() : "U"}
                          </span>
                        )}
                      </div>

                      {/* Pencil Icon Badge Overlay */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAvatarUrlInput(!showAvatarUrlInput);
                        }}
                        title="Update Image"
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md border-2 border-white dark:border-zinc-900 transition-all duration-200 active:scale-95 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Profile Image</span>
                        <button 
                          type="button" 
                          onClick={() => setShowAvatarUrlInput(!showAvatarUrlInput)}
                          className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" /> {showAvatarUrlInput ? "Hide Image Link" : "Change Image Link"}
                        </button>
                      </div>
                      
                      {showAvatarUrlInput && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col gap-1 mt-1"
                        >
                          <input
                            type="url"
                            value={avatar}
                            onChange={(e) => {
                              setAvatar(e.target.value);
                              setProfileFieldErrors((prev) => ({ ...prev, avatar: null }));
                            }}
                            placeholder="Paste image URL (https://...)"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                          />
                          {profileFieldErrors.avatar && (
                            <span className="text-[11px] font-semibold text-rose-500">{profileFieldErrors.avatar}</span>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setProfileFieldErrors((prev) => ({ ...prev, first_name: null }));
                        }}
                        placeholder="John"
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                      />
                      {profileFieldErrors.first_name && (
                        <span className="text-[11px] font-semibold text-rose-500">{profileFieldErrors.first_name}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setProfileFieldErrors((prev) => ({ ...prev, username: null }));
                      }}
                      placeholder="johndoe"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                    />
                    {profileFieldErrors.username && (
                      <span className="text-[11px] font-semibold text-rose-500">{profileFieldErrors.username}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold transition duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow transition duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Profile
                    </button>
                  </div>

                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 3. UPDATE PASSWORD / SECURITY SECTION */}
      {showUpdatePassword && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          {user?.auth_provider && user?.auth_provider !== "email" ? (
            /* Social Login Provider Card (Google / GitHub) */
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                {getProviderIcon(user.auth_provider)}
              </div>
              <div className="max-w-md flex flex-col gap-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                  Logged in with {user.auth_provider}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Your account is authenticated via <span className="font-semibold text-slate-900 dark:text-white capitalize">{user.auth_provider}</span>. Password management and security credentials are managed directly through your {user.auth_provider} account settings.
                </p>
              </div>
            </div>
          ) : (
            /* Change Password Panel (For Email Accounts) */
            <form onSubmit={handlePasswordSubmit} className="p-6 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 flex flex-col gap-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500" /> Update Password
                </h3>
                <span className="text-xs text-slate-400 dark:text-zinc-500">Secure your account</span>
              </div>

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

              {/* Current Password Field with Forgot Password Link */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Current Password</label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Forgot password? <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setIsOldPasswordVerified(false);
                      setPassFieldErrors((prev) => ({ ...prev, old_password: null }));
                    }}
                    onBlur={handleOldPasswordBlur}
                    required
                    placeholder="Enter current password"
                    className={`w-full px-3.5 py-2.5 pr-16 rounded-xl bg-slate-50 dark:bg-zinc-900 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-colors ${
                      passFieldErrors.old_password 
                        ? "border-rose-500 focus:border-rose-500" 
                        : isOldPasswordVerified 
                          ? "border-emerald-500 focus:border-emerald-500" 
                          : "border-slate-200 dark:border-zinc-800 focus:border-primary"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isVerifyingOldPass && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    {!isVerifyingOldPass && isOldPasswordVerified && <Check className="w-4 h-4 text-emerald-500" />}
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {passFieldErrors.old_password && (
                  <span className="text-[11px] font-semibold text-rose-500">{passFieldErrors.old_password}</span>
                )}
                {isOldPasswordVerified && (
                  <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Current password verified. You can now enter your new password.
                  </span>
                )}
              </div>

              {/* New Password & Password Strength Checklist (Disabled until Old Password is Verified) */}
              <div className={`flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800/50 transition-all ${
                !isOldPasswordVerified ? "opacity-60 pointer-events-none" : "opacity-100"
              }`}>
                {!isOldPasswordVerified && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold text-center">
                    🔒 Enter and verify your current password above to enable new password input fields.
                  </div>
                )}
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      disabled={!isOldPasswordVerified}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewPassword(val);
                        if (val && val === oldPassword) {
                          setPassFieldErrors((prev) => ({ ...prev, new_password: "New password cannot be identical to your current password." }));
                        } else {
                          setPassFieldErrors((prev) => ({ ...prev, new_password: null }));
                        }
                      }}
                      required
                      placeholder="Enter new password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={!isOldPasswordVerified}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passFieldErrors.new_password && (
                    <span className="text-[11px] font-semibold text-rose-500">{passFieldErrors.new_password}</span>
                  )}
                </div>

                {/* Password Policy Validation Checklist */}
                {newPassword.length > 0 && (
                  <div className="mt-1">
                    <PasswordChecklist password={newPassword} />
                  </div>
                )}

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      disabled={!isOldPasswordVerified}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPassFieldErrors((prev) => ({ ...prev, confirm_password: null }));
                      }}
                      required
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={!isOldPasswordVerified}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passFieldErrors.confirm_password && (
                    <span className="text-[11px] font-semibold text-rose-500">{passFieldErrors.confirm_password}</span>
                  )}
                </div>

              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={passSaving || !isOldPasswordVerified || (newPassword && newPassword === oldPassword)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold shadow transition duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {passSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {/* 4. LOG OUT SECTION */}
      {showLogout && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors duration-300"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log Out</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Sign out of your account session on this device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 active:scale-95 text-xs font-bold shadow transition duration-200 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </motion.div>
      )}

      {/* 5. DANGER ZONE — DELETE ACCOUNT SECTION */}
      {showDelete && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 shadow-sm transition-colors duration-300"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">Danger Zone — Delete Account</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 max-w-md">
                Permanently delete your account and all associated CSV datasets, cleaning logs, models, and saved graphs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openDeleteModal}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition duration-200 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </motion.div>
      )}

      {/* Delete Account Danger Zone Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-rose-500/30 shadow-2xl flex flex-col gap-5 text-slate-900 dark:text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Account</h3>
                    <p className="text-xs text-rose-500 font-semibold">Permanent Action — Danger Zone</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warning Content Notice */}
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold leading-relaxed">
                ⚠️ <span className="font-extrabold">Warning:</span> All your content, uploaded CSV datasets, cleaning logs, trained models, and saved visualization graphs will be permanently deleted and cannot be restored.
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Verification Form based on auth provider */}
              {user?.auth_provider === "email" ? (
                /* Password Verification for Email Users */
                <form onSubmit={handleDeleteAccountConfirm} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Enter Password to Confirm Deletion
                    </label>
                    <div className="relative">
                      <input
                        type={showDeletePassword ? "text" : "password"}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        required
                        placeholder="Enter your account password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={deleteLoading || !deletePassword}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Yes, Delete My Account
                    </button>
                  </div>
                </form>
              ) : (
                /* OTP Verification for Google / GitHub Users */
                <div className="flex flex-col gap-4">
                  {deleteMsg && (
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold text-center">
                      {deleteMsg}
                    </div>
                  )}

                  {deleteOtpStep === 1 ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-xs text-slate-600 dark:text-zinc-400 text-center">
                        Since you signed in via <span className="font-bold capitalize">{user?.auth_provider}</span>, we will send a 6-digit OTP code to your registered email <span className="font-bold">{user?.email}</span> to verify deletion.
                      </p>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={deleteLoading}
                          onClick={handleDeleteRequestOtp}
                          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Send OTP to Delete Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleDeleteAccountConfirm} className="flex flex-col gap-4">
                      <div className="block text-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1 block">
                          Enter 6-Digit OTP Code
                        </span>
                        <OtpInput length={6} value={deleteOtp} onChange={(val) => setDeleteOtp(val)} />
                      </div>

                      <button
                        type="button"
                        disabled={deleteLoading || deleteResendIn > 0}
                        onClick={handleDeleteRequestOtp}
                        className="text-center text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                      >
                        {deleteResendIn > 0 ? `Resend OTP in ${deleteResendIn}s` : "Resend OTP"}
                      </button>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={deleteLoading || deleteOtp.length !== 6}
                          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Verify & Delete Account
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default SettingsView;