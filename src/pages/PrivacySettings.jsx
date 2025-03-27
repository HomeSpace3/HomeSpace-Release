import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import '../Styles/PrivacySettings.css';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Import the AuthContext hook'
import SettingsVerify from './SettingsVerify'; // Import the Verify component

const PrivacySettings = () => {
  const [dataCollection, setDataCollection] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [deviceAccess, setDeviceAccess] = useState(true);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // New state for notifications
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [viewQRCode, setViewQRCode] = useState(false);
  console.log("2FA Enabled:", twoFactorEnabled);

  const { user } = useAuth(); // Get the logged-in user
  const userId = user?.uid; // Get the user ID

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        const userRef = doc(db, "Users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setTwoFactorEnabled(userSnap.data().twoFactorEnabled);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleDataCollectionChange = () => {
    setDataCollection(!dataCollection);
  };

  const handleCookieConsentChange = () => {
    setCookieConsent(!cookieConsent);
  };

  const handlePersonalizedAdsChange = () => {
    setPersonalizedAds(!personalizedAds);
  };

  const handleDeviceAccessChange = () => {
    setDeviceAccess(!deviceAccess);
  };

  const handleVoiceRecordingChange = () => {
    setVoiceRecording(!voiceRecording);
  };

  const handleNotificationsChange = () => {  // Handle toggle for notifications
    setNotificationsEnabled(!notificationsEnabled);
  };

  const generate2FA = async () => {
    if (!twoFactorEnabled) {
        try {
          // Fetch QR Code and Secret
          const response = await axios.post("http://10.6.139.101:5000/generate-2fa", { userId });
          setQrCode(response.data.qrCode);
          setSecret(response.data.secret);
          setViewQRCode(true); // Show QR code only on first enable
        } catch (error) {
          console.error("Error enabling 2FA:", error);
        }
    } else {
      const confirmation = window.confirm("Are you sure you want to disable Two-Factor Authentication?");
      if (confirmation) {
        try {
          setTwoFactorEnabled(false);
          await updateDoc(doc(db, "Users", userId), { twoFactorEnabled: false, twoFactorVerified: false });

          // Clear QR Code when disabled
          setQrCode(null);
          setSecret("");
          await updateDoc(doc(db, "Users", userId), { secret: "" });
          setViewQRCode(false);
        } catch (error) {
          console.error("Error disabling 2FA:", error);
        }
      }
    }
  };

  const handleClearCache = () => {
    // Example for clearing localStorage (adjust for your needs)
    localStorage.clear();
    sessionStorage.clear();
    alert("Cache has been cleared!");
  };

  return (
    <div className="privacy-settings-container">
      <h2 className="smart-home-heading">Privacy Settings</h2>

      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={dataCollection}
            onChange={handleDataCollectionChange}
          />
          Allow Data Collection
        </label>
        <p>Your data may be collected to improve smart home services and enhance automation features.</p>
      </div>
      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={cookieConsent}
            onChange={handleCookieConsentChange}
          />
          Allow Cookies
        </label>
        <p>We use cookies to optimize your smart home experience and provide personalized content.</p>
      </div>
      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={personalizedAds}
            onChange={handlePersonalizedAdsChange}
          />
          Personalized Ads
        </label>
        <p>Show ads based on your preferences and home device usage.</p>
      </div>
      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={deviceAccess}
            onChange={handleDeviceAccessChange}
          />
          Allow Access to Devices
        </label>
        <p>Grant permission for smart devices to communicate and operate with each other.</p>
      </div>
      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={voiceRecording}
            onChange={handleVoiceRecordingChange}
          />
          Allow Voice Recording
        </label>
        <p>Enable voice assistants to record and process voice commands for a better experience.</p>
      </div>
      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={handleNotificationsChange}  // Call the toggle function here
          />
          Enable Notifications
        </label>
        <p>Enable notifications for updates and alerts regarding your smart home system.</p>
      </div>
      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={twoFactorEnabled}
            onChange={generate2FA}
          />
          Enable Two-Factor Authentication
        </label>
        <p>Secure your account with an additional layer of protection using 2FA.</p>
      </div>
      {qrCode && (
      <div className="modal modal-card">
        <button className="close-button" onClick={() => { setQrCode(null); setSecret(""); updateDoc(doc(db, "Users", userId), { secret: "" }); setViewQRCode(false); }}>X</button>
        <div className="auth-modal-content">
          <h3 className="authentication-title">Two-Factor Authentication</h3>
          <p>Scan this QR code with Google Authenticator:</p>
          <img src={qrCode} alt="QR Code" />
          {secret && <p>Backup Code: {secret}</p>}
          <hr className="line-separator" />
          <SettingsVerify />
        </div>
      </div>
      )}
      <div className="clear-cache">
        <button onClick={handleClearCache}>Clear Cache</button>
        <p>This will clear your cached data and settings.</p>
      </div>
      <div className="save-button">
        <button onClick={() => alert('Settings Saved!')}>Save Settings</button>
      </div>
    </div>
  );
};

export default PrivacySettings;
