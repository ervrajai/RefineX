import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleLogout = async () => {
        try {
            // Hit your DRF Logout endpoint using the configured api instance
            await api.post('accounts/logout/');
            
            // Clear any frontend state (e.g., Redux, Context, localStorage) here
            
            // Redirect back to the login/signup page
            navigate('/login');
        } catch (err) {
            console.error("Logout failed:", err);
            setError("Failed to log out. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to RefineX!</h1>
                <p className="text-gray-600 mb-8">You have successfully signed in.</p>
                
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button 
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default Dashboard;