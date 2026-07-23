import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  KeyRound,
  Sun,
  Moon,
  TvMinimal,
  LogOut,
  Check,
  AlertCircle,
  Loader2,
  Edit3,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  Pencil,
  Search,
  ShieldAlert,
  Mail,
  Calendar,
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

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(
    user?.profile_picture || user?.avatar || "",
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalStep, setPasswordModalStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passModalVerifyError, setPassModalVerifyError] = useState("");
  const [passModalSubmitError, setPassModalSubmitError] = useState("");
  const [passModalSaving, setPassModalSaving] = useState(false);
  const [passModalVerifying, setPassModalVerifying] = useState(false);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtpStep, setDeleteOtpStep] = useState(1);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setUsername(
        user.username || (user.email ? user.email.split("@")[0] : ""),
      );
      setAvatar(user.profile_picture || user.avatar || "");
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

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProviderBadge = (provider) => {
    switch (provider) {
      case "google":
        return "Google";
      case "github":
        return "GitHub";
      default:
        return "Email";
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });

    if (!firstName.trim()) {
      setProfileMsg({ type: "error", text: "First name is required." });
      return;
    }

    setProfileSaving(true);
    try {
      const response = await api.patch("accounts/profile/", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        profile_picture: avatar.trim(),
        avatar: avatar.trim(),
      });
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      setIsEditingProfile(false);
      if (onProfileUpdate && response.data) onProfileUpdate(response.data);
    } catch (err) {
      setProfileMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setProfileSaving(false);
    }
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordModalStep(1);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPassModalVerifyError("");
    setPassModalSubmitError("");
  };

  const closePasswordModal = () => setShowPasswordModal(false);

  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword.trim()) {
      setPassModalVerifyError("Enter current password.");
      return;
    }
    setPassModalVerifying(true);
    setPassModalVerifyError("");
    try {
      await api.post("accounts/verify-password/", {
        password: currentPassword,
      });
      setPasswordModalStep(2);
    } catch (err) {
      setPassModalVerifyError("Incorrect password.");
    } finally {
      setPassModalVerifying(false);
    }
  };

  const handleSubmitNewPassword = async () => {
    setPassModalSubmitError("");
    if (!validatePassword(newPassword)) {
      setPassModalSubmitError("Password requirements not met.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassModalSubmitError("Passwords do not match.");
      return;
    }
    setPassModalSaving(true);
    try {
      await api.post("accounts/change-password/", {
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      closePasswordModal();
    } catch (err) {
      setPassModalSubmitError("Failed to update password.");
    } finally {
      setPassModalSaving(false);
    }
  };

  const handleDeleteRequestOtp = async () => {
    setDeleteError("");
    setDeleteMsg("");
    setDeleteLoading(true);
    try {
      await api.post("accounts/delete-account/request-otp/");
      setDeleteMsg(`OTP sent to email`);
      setDeleteOtpStep(2);
    } catch (err) {
      setDeleteError("Could not send OTP.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccountConfirm = async (e) => {
    e.preventDefault();
    setDeleteError("");
    setDeleteLoading(true);

    try {
      const payload =
        user?.auth_provider === "email"
          ? { password: deletePassword }
          : { otp: deleteOtp };

      await api.post("accounts/delete-account/confirm/", payload);
      if (setLoggedOut) setLoggedOut();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError("Failed to delete account.");
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

  const query = searchQuery.trim().toLowerCase();
  const matchesSearch = (...keywords) =>
    !query || keywords.some((kw) => kw && kw.toLowerCase().includes(query));

  const showAppearance = matchesSearch(
    "appearance",
    "theme",
    "dark",
    "light",
    "mode",
  );
  const showProfile = matchesSearch(
    "profile",
    "name",
    "email",
    "username",
    "edit",
  );
  const showUpdatePassword = matchesSearch(
    "security",
    "password",
    "update password",
  );
  const showLogout = matchesSearch("logout", "log out", "sign out");
  const showDelete = matchesSearch("delete", "danger", "remove account");

  const hasMatches =
    showAppearance ||
    showProfile ||
    showUpdatePassword ||
    showLogout ||
    showDelete;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto font-sans antialiased text-slate-900 dark:text-zinc-100 pb-16 px-3 sm:px-4 md:px-0">
      {/* Settings Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1">
        {/* Page Title */}
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-zinc-400 mt-0.5">
            Manage your account, profile, and security preferences
          </p>
        </div>

        {/* Search Bar - Full Width below title on Mobile, Right-aligned on Desktop */}
        <div className="relative w-full sm:w-64 lg:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="w-full pl-9 pr-8 py-3 rounded-4xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!hasMatches && (
        <div className="p-6 rounded-3xl bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 flex flex-col items-center text-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <p className="text-xs text-slate-400">
            No settings found matching "{searchQuery}"
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Profile Section Card */}
      {showProfile && (
        <div className="flex flex-col gap-3">
          <div className="relative flex flex-col w-full rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Banner Backdrop */}
            <div className="relative h-28 sm:h-40 lg:h-48 w-full bg-[#0a0314] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#110826] via-[#210b42] to-[#3b0764]" />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-28 top-1/3 -translate-y-1/2 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute left-10 -bottom-10 w-44 h-44 bg-fuchsia-600/20 rounded-full blur-2xl pointer-events-none" />

              <div className="absolute right-0 top-0 bottom-0 w-3/4 sm:w-3/5 pointer-events-none opacity-95">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 500 200"
                  preserveAspectRatio="xMaxYMid slice"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="purpleGlow"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop
                        offset="50%"
                        stopColor="#c084fc"
                        stopOpacity="0.7"
                      />
                      <stop
                        offset="100%"
                        stopColor="#e879f9"
                        stopOpacity="0.4"
                      />
                    </linearGradient>

                    <radialGradient id="cyanStar" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop
                        offset="30%"
                        stopColor="#38bdf8"
                        stopOpacity="0.9"
                      />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="purpleStar" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop
                        offset="35%"
                        stopColor="#d8b4fe"
                        stopOpacity="0.9"
                      />
                      <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <g
                    stroke="url(#purpleGlow)"
                    strokeWidth="0.8"
                    fill="none"
                    opacity="0.8"
                  >
                    <polygon
                      points="340,15 380,35 365,75"
                      fill="rgba(56, 189, 248, 0.12)"
                    />
                    <polygon
                      points="380,35 435,25 415,85"
                      fill="rgba(192, 132, 252, 0.15)"
                    />
                    <polygon
                      points="415,85 465,65 475,115"
                      fill="rgba(56, 189, 248, 0.08)"
                    />
                    <polygon
                      points="365,75 415,85 390,135"
                      fill="rgba(232, 121, 249, 0.12)"
                    />
                    <polygon
                      points="390,135 445,145 415,85"
                      fill="rgba(192, 132, 252, 0.1)"
                    />
                    <polygon
                      points="320,95 365,75 350,145"
                      fill="rgba(56, 189, 248, 0.06)"
                    />
                    <polygon
                      points="445,145 475,115 485,175"
                      fill="rgba(168, 85, 247, 0.12)"
                    />

                    <line x1="340" y1="15" x2="295" y2="45" />
                    <line x1="380" y1="35" x2="400" y2="5" />
                    <line x1="435" y1="25" x2="485" y2="15" />
                    <line x1="320" y1="95" x2="275" y2="115" />
                    <line x1="390" y1="135" x2="360" y2="185" />
                    <line x1="485" y1="175" x2="440" y2="195" />
                  </g>

                  <g fill="#38bdf8">
                    <circle cx="340" cy="15" r="2.5" />
                    <circle cx="380" cy="35" r="3" />
                    <circle cx="365" cy="75" r="2.5" />
                    <circle cx="435" cy="25" r="3" fill="#e879f9" />
                    <circle cx="415" cy="85" r="4" fill="#ffffff" />
                    <circle cx="465" cy="65" r="2.5" />
                    <circle cx="390" cy="135" r="3.5" fill="#e879f9" />
                    <circle cx="445" cy="145" r="3" />
                    <circle cx="320" cy="95" r="2" />
                    <circle cx="475" cy="115" r="3.5" fill="#ffffff" />
                  </g>

                  <circle cx="415" cy="85" r="12" fill="url(#cyanStar)" />
                  <circle cx="380" cy="35" r="10" fill="url(#purpleStar)" />
                  <circle cx="475" cy="115" r="11" fill="url(#cyanStar)" />
                  <circle cx="435" cy="25" r="8" fill="url(#purpleStar)" />
                </svg>
              </div>
            </div>

            {/* Profile Detail Content */}
            <div className="relative px-3.5 sm:px-6 pb-4 sm:pb-6 pt-0">
              <div className="flex justify-between items-end -mt-8 sm:-mt-14 mb-3">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-slate-200 dark:bg-zinc-800 border-2 sm:border-4 border-white dark:border-zinc-900 overflow-hidden shadow-md flex items-center justify-center transition-transform group-hover:scale-102">
                    {user?.profile_picture || user?.avatar ? (
                      <img
                        src={user?.profile_picture || user?.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                        {user?.first_name
                          ? user.first_name[0].toUpperCase()
                          : "U"}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 p-1 sm:p-1.5 rounded-full bg-purple-700 text-white border border-white dark:border-zinc-900 shadow">
                    <Pencil className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-200/80 dark:hover:bg-zinc-700/80 transition cursor-pointer shadow-xs"
                >
                  {isEditingProfile ? (
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  ) : (
                    <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500" />
                  )}
                  <span>{isEditingProfile ? "Cancel" : "Edit Profile"}</span>
                </button>
              </div>

              <div className="flex flex-col gap-0.5 sm:gap-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {loading
                      ? "..."
                      : user?.first_name || user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : "User"}
                  </h2>
                  {user?.is_email_verified && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0 sm:w-5 sm:h-5"
                    >
                      <defs>
                        <linearGradient
                          id="purpleGradient"
                          x1="2"
                          y1="2"
                          x2="22"
                          y2="22"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop offset="0%" stopColor="#A855F7" />
                          <stop offset="100%" stopColor="#6B21A8" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 2L14.15 3.55L16.74 3.19L18.12 5.43L20.67 6.07L21.03 8.68L22.95 10.45L22.18 12.95L22.95 15.45L21.03 17.22L20.67 19.83L18.12 20.47L16.74 22.71L14.15 22.35L12 23.9L9.85 22.35L7.26 22.71L5.88 20.47L3.33 19.83L2.97 17.22L1.05 15.45L1.82 12.95L1.05 10.45L2.97 8.68L3.33 6.07L5.88 5.43L7.26 3.19L9.85 3.55L12 2Z"
                        fill="url(#purpleGradient)"
                      />
                      <path
                        d="M9.8 15.6L6.7 12.5L5.3 13.9L9.8 18.4L18.7 9.5L17.3 8.1L9.8 15.6Z"
                        fill="white"
                      />
                    </svg>
                  )}
                </div>

                <p className="text-[11px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400">
                  @
                  {user?.username ||
                    (user?.email ? user.email.split("@")[0] : "user")}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-1 text-[11px] sm:text-xs font-normal text-slate-400 dark:text-zinc-400 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 mt-2">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    <span>{user?.email}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    <span>Joined {formatDate(user?.date_joined)}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400">
                    {getProviderBadge(user?.auth_provider)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <AnimatePresence>
            {isEditingProfile && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleProfileSubmit}
                className="overflow-hidden"
              >
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col gap-3.5">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-purple-500" /> Edit
                    Profile Details
                  </h3>

                  {profileMsg.text && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
                        profileMsg.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] sm:text-xs font-semibold text-slate-400">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] sm:text-xs font-semibold text-slate-400">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-400">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-300/60 dark:hover:bg-zinc-700/60 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow flex items-center gap-1 disabled:opacity-50 transition"
                    >
                      {profileSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Appearance Section */}
      {showAppearance && (
        <div className="flex flex-col p-4 sm:p-5 rounded-3xl bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Moon className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Appearance
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-zinc-400 mb-3">
            Select your preferred display theme
          </p>

          <div className="grid grid-cols-3 gap-1 bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl sm:rounded-2xl border border-slate-300/40 dark:border-zinc-700/50 w-full">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "auto", label: "Auto", icon: TvMinimal },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = themeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => changeTheme(mode.id)}
                  className={`relative flex items-center justify-center gap-1.5 py-2 rounded-lg sm:rounded-xl text-xs font-semibold cursor-pointer ${
                    isSelected
                      ? "text-slate-950 dark:text-white"
                      : "text-slate-400 dark:text-zinc-400"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="theme-tab-responsive"
                      className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg sm:rounded-xl shadow-xs"
                      transition={{
                        type: "spring",
                        bounce: 0.1,
                        duration: 0.3,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Security Section */}
      {showUpdatePassword && (
        <div>
          {user?.auth_provider && user?.auth_provider !== "email" ? (
            <div className="p-4 rounded-3xl bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-purple-500 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Social Account Connected
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Signed in via{" "}
                  <span className="capitalize font-semibold">
                    {user.auth_provider}
                  </span>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Security & Password
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-400">
                    {user?.password_last_updated
                      ? `Updated ${formatDate(user.password_last_updated)}`
                      : "Sign-in credentials"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openPasswordModal}
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                Update Password
              </button>
            </div>
          )}
        </div>
      )}

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={closePasswordModal}
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-t sm:border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col gap-4 z-10"
            >
              <div className="w-10 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden mb-1" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {passwordModalStep === 1
                      ? "Verify Current Password"
                      : "Set New Password"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-1.5">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      passwordModalStep >= s
                        ? "bg-purple-600"
                        : "bg-slate-200 dark:bg-zinc-800"
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {passwordModalStep === 1 ? (
                  <motion.div
                    key="modal-step-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3"
                  >
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Enter your existing password to proceed.
                    </p>

                    {passModalVerifyError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {passModalVerifyError}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] sm:text-xs font-semibold text-slate-400">
                          Current Password
                        </label>
                        <Link
                          to="/forgot-password"
                          className="text-[10px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                          onClick={closePasswordModal}
                        >
                          Forgot?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setPassModalVerifyError("");
                          }}
                          autoFocus
                          placeholder="Current password"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border-none text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyCurrentPassword}
                      disabled={passModalVerifying || !currentPassword.trim()}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow transition flex justify-center items-center gap-1.5 disabled:opacity-50 mt-1 cursor-pointer"
                    >
                      {passModalVerifying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Continue"
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="modal-step-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3"
                  >
                    {passModalSubmitError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {passModalSubmitError}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] sm:text-xs font-semibold text-slate-400">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          autoFocus
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border-none text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {newPassword.length > 0 && (
                      <PasswordChecklist password={newPassword} />
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] sm:text-xs font-semibold text-slate-400">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border-none text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPasswordModalStep(1)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-500 text-xs font-semibold hover:bg-slate-300/60 dark:hover:bg-zinc-700/60 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitNewPassword}
                        disabled={
                          passModalSaving || !newPassword || !confirmPassword
                        }
                        className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow flex justify-center items-center gap-1.5 disabled:opacity-50 transition"
                      >
                        {passModalSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Save Password"
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Section */}
      {showLogout && (
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-200/80 dark:bg-zinc-800 text-slate-500 dark:text-zinc-300">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Log Out
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                Sign out on this device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition cursor-pointer"
          >
            Log Out
          </button>
        </div>
      )}

      {/* Delete Account Section */}
      {showDelete && (
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                Delete Account
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                Permanent data erasure
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openDeleteModal}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-md p-4 sm:p-6 rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-rose-500/20 shadow-2xl flex flex-col gap-3.5"
            >
              <div className="w-10 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Delete Account
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 leading-normal">
                Warning: Account data will be permanently erased.
              </p>

              {deleteError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {user?.auth_provider === "email" ? (
                <form
                  onSubmit={handleDeleteAccountConfirm}
                  className="flex flex-col gap-3"
                >
                  <div className="relative">
                    <input
                      type={showDeletePassword ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      required
                      placeholder="Account password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border-none text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showDeletePassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-500 text-xs font-semibold hover:bg-slate-300/60 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={deleteLoading || !deletePassword}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow disabled:opacity-50 transition"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3">
                  {deleteMsg && (
                    <p className="text-xs text-purple-600 text-center">
                      {deleteMsg}
                    </p>
                  )}
                  {deleteOtpStep === 1 ? (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(false)}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-500 text-xs font-semibold hover:bg-slate-300/60 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteLoading}
                        onClick={handleDeleteRequestOtp}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow disabled:opacity-50 transition"
                      >
                        Send OTP
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleDeleteAccountConfirm}
                      className="flex flex-col gap-3"
                    >
                      <OtpInput
                        length={6}
                        value={deleteOtp}
                        onChange={(val) => setDeleteOtp(val)}
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(false)}
                          className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-500 text-xs font-semibold hover:bg-slate-300/60 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={deleteLoading || deleteOtp.length !== 6}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow disabled:opacity-50 transition"
                        >
                          Confirm Delete
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
