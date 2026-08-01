import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Clock, Layers, Download, FileText, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "../../components/Landing/Navbar";
import Footer from "../../components/Landing/Footer";
import CleanView from "../../components/Dashboard/CleanView";
import LimitModal from "../../components/Landing/LimitModal";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getGuestId } from "../../utils/guestSession";

export default function GuestCleanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  // Guest Session states
  const [session, setSession] = useState({
    clean_count: 0,
    remaining_cleans: 3,
    limit_reached: false,
    datasets: []
  });
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState({
    title: "Daily Guest Limit Reached",
    badge: "Guest Tier Limit",
    message: "You've used your 3 free guest dataset cleans for today. Log in or create a free account to unlock unlimited data cleaning, interactive visualizations, and ML training!"
  });

  const handleOpenAuthModal = (tabName) => {
    if (isLoggedIn) {
      navigate("/dashboard", { state: { activeTab: tabName, datasetId } });
      return;
    }
    if (tabName === "visualization") {
      setModalDetails({
        title: "Account Required for Data Visualization",
        badge: "Pro Feature Locked",
        message: "Interactive Data Visualizations require a free RefineX account. Log in or sign up now to generate line, bar, scatter, and pie charts!"
      });
    } else if (tabName === "model-training") {
      setModalDetails({
        title: "Account Required for ML Model Training",
        badge: "Pro Feature Locked",
        message: "Automated Machine Learning Model Training requires a free RefineX account. Log in or sign up now to train Regression and Random Forest models!"
      });
    } else {
      setModalDetails({
        title: "Daily Guest Limit Reached",
        badge: "Guest Tier Limit",
        message: "You've used your 3 free guest dataset cleans for today. Log in or create a free account to unlock unlimited data cleaning, interactive visualizations, and ML training!"
      });
    }
    setIsLimitModalOpen(true);
  };



  // CleanView states
  const [datasetId, setDatasetId] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [report, setReport] = useState(null);
  const [preview, setPreview] = useState(null);
  const [beforeReport, setBeforeReport] = useState(null);
  const [afterReport, setAfterReport] = useState(null);
  const [cleanLogs, setCleanLogs] = useState([]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchGuestSession = async () => {
    if (isLoggedIn) return;
    const guestId = getGuestId();
    try {
      const res = await api.get("guest/session/", {
        params: { guest_id: guestId },
        headers: { "X-Guest-ID": guestId }
      });
      if (res.data) {
        setSession(res.data);
      }
    } catch (err) {
      console.error("Failed to load guest session:", err);
    }
  };

  useEffect(() => {
    fetchGuestSession();
  }, [isLoggedIn]);

  // Intercept API calls for guest headers
  useEffect(() => {
    const guestId = getGuestId();
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (guestId) {
        config.headers["X-Guest-ID"] = guestId;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        if (!isLoggedIn && (response.config.url?.includes("/clean/") || response.config.url?.includes("/decide/"))) {
          fetchGuestSession();
        }
        return response;
      },
      (error) => {
        if (!isLoggedIn && error.response?.status === 403 && error.response?.data?.limit_reached) {
          setSession((prev) => ({ ...prev, limit_reached: true, remaining_cleans: 0 }));
          setIsLimitModalOpen(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [isLoggedIn]);

  const handleSelectHistoryDataset = async (ds) => {
    try {
      const res = await api.get(`cleaning/${ds.id}/preview/?offset=0&limit=100`);
      setDatasetId(ds.id);
      setMetadata(res.data.metadata);
      setPreview(res.data);
      setReport(res.data.metadata);
      if (ds.logs) setCleanLogs(ds.logs);
    } catch (err) {
      console.error("Failed to load historical dataset:", err);
    }
  };

  const triggerDownload = (url, filename) => {
    const fullUrl = url.startsWith("http") ? url : `${api.defaults.baseURL.replace(/\/api\/?$/, "")}${url}`;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.setAttribute("download", filename || "cleaned_dataset.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Live Daily Limit Reset Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00", dayText: "" });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const dayText = now.toLocaleDateString('en-US', options);

      setTimeLeft({
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
        dayText
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-lightBg dark:bg-darkBg text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <LimitModal
        isOpen={!isLoggedIn && isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        title={modalDetails.title}
        badge={modalDetails.badge}
        message={modalDetails.message}
      />


      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-left">
        {/* Top Header Bar: Countdown Timer Card & Daily Guest Limit Pill */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Live Reset Countdown Time Card (No moon, proper card size) */}
          {!isLoggedIn && (
            <div 
              className="relative overflow-hidden rounded-[15px] p-3.5 px-5 text-white transition-all duration-300 flex flex-col justify-center min-w-[260px] border border-slate-700/50 shadow-md cursor-pointer hover:shadow-lg"
              style={{
                background: 'linear-gradient(to right, rgb(20, 30, 48), rgb(36, 59, 85))'
              }}
            >
              <div className="flex items-baseline gap-2 font-['Gill_Sans','Gill_Sans_MT',Calibri,'Trebuchet_MS',sans-serif]">
                <span className="text-3xl font-extrabold tracking-tight">
                  {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
                </span>
                <span className="text-xs font-semibold tracking-wide text-cyan-300 uppercase">
                  UNTIL RESET
                </span>
              </div>
              <p className="text-xs font-medium text-slate-300 mt-0.5 truncate font-['Gill_Sans','Gill_Sans_MT',Calibri,'Trebuchet_MS',sans-serif]">
                Limit restores at 12:00 AM • {timeLeft.dayText}
              </p>
            </div>
          )}

          {/* Daily Guest Limit Pill */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 shadow-md backdrop-blur-sm self-start sm:self-auto sm:ml-auto">
            {isLoggedIn ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
            ) : (
              <Clock className="w-4.5 h-4.5 text-purple-500" />
            )}
            <div className="text-xs">
              <span className="text-slate-500 dark:text-zinc-400 block font-medium">
                {isLoggedIn ? "Account Active" : "Daily Guest Limit"}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {isLoggedIn
                  ? "Unlimited Data Cleaning"
                  : `${session.remaining_cleans} of 3 free cleans remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Limit Warning Banner if 0 remaining for Guests */}
        {!isLoggedIn && session.remaining_cleans <= 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 dark:bg-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                  Daily Guest Limit Reached (3 / 3 Cleans Used)
                </h4>
                <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
                  Sign up or log in now to unlock unlimited dataset cleans, interactive visualizations, and automated ML model training!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setIsLimitModalOpen(true)}
                className="px-5 py-2.5 bg-[#673ab7] hover:bg-[#522e93] text-white font-bold text-xs rounded-xl transition-colors duration-200 cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <span>Unlock Unlimited Cleans</span>
              </button>
            </div>
          </div>
        )}

        {/* 3 Cleaned Datasets Slots Panel */}
        <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
            <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-2 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-purple-500" />
              Guest Daily Cleaned Datasets (3 Attempts)
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
              Click any cleaned dataset to restore preview or download CSV
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => {
              const ds = session.datasets && session.datasets[idx];
              if (ds) {
                const isSelected = datasetId === ds.id;
                return (
                  <div
                    key={ds.id || idx}
                    onClick={() => handleSelectHistoryDataset(ds)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3.5 ${
                      isSelected
                        ? "border-purple-500 bg-purple-500/10 dark:bg-purple-500/15 shadow-xl ring-2 ring-purple-500/40"
                        : "border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#202026] hover:border-purple-500/50 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {ds.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            {ds.rows || 0} rows • {ds.columns || 0} cols
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        Cleaned #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-zinc-800/80">
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                        {isSelected ? "Active in Cleaner" : "Click to Restore"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerDownload(ds.download_url, `cleaned_${ds.name}`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#673ab7] hover:bg-[#522e93] text-white text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-md active:scale-95"
                        title="Download Cleaned CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download CSV</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`empty-${idx}`}
                  className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800/90 bg-slate-50/40 dark:bg-[#141418] flex flex-col justify-center items-center text-center gap-2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 text-xs font-extrabold shadow-inner">
                    #{idx + 1}
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                    Clean Attempt #{idx + 1} Available
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                    Upload a CSV file below to clean
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dashboard's Exact CleanView Module Wrapper */}
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl">
          <CleanView
            isGuest={true}
            datasetId={datasetId}
            setDatasetId={setDatasetId}
            metadata={metadata}
            setMetadata={setMetadata}
            report={report}
            setReport={setReport}
            preview={preview}
            setPreview={setPreview}
            beforeReport={beforeReport}
            setBeforeReport={setBeforeReport}
            afterReport={afterReport}
            setAfterReport={setAfterReport}
            cleanLogs={cleanLogs}
            setCleanLogs={setCleanLogs}
            setActiveTab={(tab) => handleOpenAuthModal(tab)}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
