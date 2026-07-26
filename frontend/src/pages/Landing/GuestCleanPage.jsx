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
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-lightBorder dark:border-borderDark">
          <div>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-brand transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {isLoggedIn ? "Data Cleaning Studio" : "Guest Data Cleaning Studio"}
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-xs font-bold uppercase tracking-wider">
                {isLoggedIn ? "Pro Tier" : "Guest Tier"}
              </span>
            </div>
          </div>

          {/* Usage Pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-lightElevated dark:bg-panel border border-lightBorder dark:border-borderDark shadow-sm self-start sm:self-auto">
            {isLoggedIn ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Clock className="w-4 h-4 text-brand" />
            )}
            <div className="text-xs">
              <span className="text-slate-500 dark:text-zinc-400 block font-medium">
                {isLoggedIn ? "Account Active" : "Daily Guest Limit"}
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {isLoggedIn
                  ? "Unlimited Data Cleaning"
                  : `${session.remaining_cleans} of 3 free cleans remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Limit Warning Banner if 0 remaining for Guests */}
        {!isLoggedIn && session.remaining_cleans <= 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
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
                className="px-5 py-2.5 bg-[#673ab7] hover:bg-[#522e93] text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-md hover:shadow-purple-500/20 flex items-center gap-1.5 active:scale-[0.98]"
              >
                <span>Unlock Unlimited Cleans</span>
              </button>
            </div>
          </div>
        )}



        {/* 24-Hour Returning Guest Datasets Bar */}
        {session.datasets && session.datasets.length > 0 && (
          <div className="mb-8 p-4 rounded-2xl bg-lightElevated dark:bg-panel border border-lightBorder dark:border-borderDark shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-brand" />
                Your Cleaned Datasets (Last 24 Hours)
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500">
                Click any dataset to inspect or re-download
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {session.datasets.map((ds) => (
                <div
                  key={ds.id}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    datasetId === ds.id
                      ? "border-brand bg-brand/10 dark:bg-brand/20"
                      : "border-lightBorder/70 dark:border-borderDark/70 bg-lightBg dark:bg-darkBg/60 hover:border-brand/40"
                  }`}
                  onClick={() => handleSelectHistoryDataset(ds)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-brand shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {ds.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {ds.rows || 0} rows • {ds.columns || 0} cols
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerDownload(ds.download_url, `cleaned_${ds.name}`);
                    }}
                    className="p-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand dark:text-white transition-colors shrink-0"
                    title="Download Cleaned CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard's Exact CleanView Module */}
        <div className="bg-lightElevated dark:bg-panel border border-lightBorder dark:border-borderDark rounded-3xl p-4 sm:p-6 shadow-xl">
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
