import { useState, useEffect } from "react";
import { CheckCircle, KeyRound } from "lucide-react";
import { Button } from "../components/Button";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import "../Styles/HomeSetup.css";
import arrow from '../assets/arrow.png';

export default function HomeSetup() {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(1);
  const [homeName, setHomeName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [homeCreated, setHomeCreated] = useState(false);
  const [generatedHomeId, setGeneratedHomeId] = useState("");
  const [error, setError] = useState("");
  const [isUnderage, setIsUnderage] = useState(false);
  const [userHasHome, setUserHasHome] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserDetails = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // check Age
        const birthDate = new Date(userData.dateOfBirth);
        let age = new Date().getFullYear() - birthDate.getFullYear();
        const monthDiff = new Date().getMonth() - birthDate.getMonth();
        const dayDiff = new Date().getDate() - birthDate.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age--;
        }
        setIsUnderage(age < 18);

        // Check if user has HomeId
        setUserHasHome(!!userData.homeId);
      }
    };

    checkUserDetails();
  }, []);

  const options = [
    {
      id: "create",
      icon: <CheckCircle className="w-8 h-8 text-green-500" />, // Create icon
      title: "Create a New Home",
      description: "Start fresh and manage everything as an admin.",
    },
    {
      id: "join",
      icon: <KeyRound className="w-8 h-8 text-yellow-500" />, // Join icon
      title: "Join a Home with an ID",
      description: "Enter a home ID to join an existing home.",
    },
  ];

  const handleContinue = () => {
    setStep(2);
  };

  const generateHomeId = () => {
    return `home_${Math.random().toString(36).substring(2, 10)}`;
  };

  const copyToClipboard = (generateHomeId) => {
    const textField = document.createElement("textarea");
    textField.value = generateHomeId;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    document.body.removeChild(textField);
    alert("Home ID Copied!");
  };

  const adminPermissions = {
    addDevice: true,
    removeDevice: true,
    manageScenes: true,
    viewAnalytics: true,
  };

  const userPermissions = {
    addDevice: true,
    removeDevice: false,
    manageScenes: true,
    viewAnalytics: true,
  };

  const handleCreateHome = async () => {
    if (!homeName || isUnderage) return;

    localStorage.setItem("homeCreationInProgress", "true"); // Set flag

    const homeId = generateHomeId();
    setGeneratedHomeId(homeId);
    const user = auth.currentUser;

    try {
      // create the home document
      await setDoc(doc(db, "Homes", homeId), {
        homeId: homeId,
        homeName: homeName,
        deviceCount: 0,
        energyUsage: 0,
        members: [user.uid],
        ownerId: user.uid,
        membersPermissions: {
          [user.uid]: adminPermissions,
        },
        createdAt: new Date(),
      });

      // create the devices subcollection within the home doc
      const devicesRef = collection(db, `Homes/${homeId}/devices`);
      await setDoc(doc(devicesRef, "initial_device"), {
        name: "Initial Device",
        type: "placeholder",
        status: false,
        powerRating_kW: 0,
      });

      // Create the energyConsumption subcollection within the initial device doc
      const energyConsumptionRef = collection(db, `Homes/${homeId}/devices/initial_device/energyConsumption`);
      await setDoc(doc(energyConsumptionRef, "daily"), {});
      await setDoc(doc(energyConsumptionRef, "monthly"), {});
      await setDoc(doc(energyConsumptionRef, "yearly"), {});

      // Create the energyRecords subcollection with initial records
      const energyRecordsRef = collection(db, `Homes/${homeId}/energyRecords`);
      await setDoc(doc(energyRecordsRef, "daily"), {});
      await setDoc(doc(energyRecordsRef, "monthly"), {});
      await setDoc(doc(energyRecordsRef, "yearly"), {});

      // Initialize the `scenes` subcollection with a default scene
      const scenesRef = collection(db, `Homes/${homeId}/scenes`);
      await setDoc(doc(scenesRef, "welcome_scene"), {
        name: "Welcome Scene",
        userId: user.uid,
        createdAt: new Date(),
        type: "TapToRun", // Default type
        devices: {}, // Empty device list initially
      });

      // Update the user's document
      await updateDoc(doc(db, "Users", user.uid), {
        homeId: homeId,
        isAdmin: true,
      });

      setHomeCreated(true);
    } catch (error) {
      console.error("Error creating home:", error);
      setError("Error creating home. Please try again.");
    }
  };

  const handleJoinHome = async () => {
    if (!joinCode) return;
    const user = auth.currentUser;

    try {
      const homeRef = doc(db, "Homes", joinCode);
      const homeDoc = await getDoc(homeRef);
      if (!homeDoc.exists()) {
        setError("Home ID does not exist. Please check and try again.");
        return;
      }

      await updateDoc(homeRef, {
        members: arrayUnion(user.uid),
        [`membersPermissions.${user.uid}`]: userPermissions, // Store Permissions inside Home Doc
      });

      await updateDoc(doc(db, "Users", user.uid), {
        homeId: joinCode,
        isAdmin: false,
      });

      console.log("Joined Home Successfully!");
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Error joining home:", error);
      setError("Error joining home. Please try again.");
    }
  };

  const navigateToLanding = () => {
    window.location.href = "/";
  };

  return (
    <div className="home-setup-container">
      <div className="home-setup-card">
        {step === 1 ? (
          <>
            <h2 className="home-setup-title">Choose Your Home Setup</h2>
            <p className="home-setup-description">To start using HomeSpace, you need to set up your home. This helps us personalize your experience!</p>
            <div className="space-y-6">
              {options.map((option) => (
                <div
                  key={option.id}
                  className={`home-setup-option ${selected === option.id ? "selected" : ""}`}
                  onClick={() => setSelected(option.id)}
                >
                  <div className="home-setup-option-icon">{option.icon}</div>
                  <div className="home-setup-option-content">
                    <h3 className="home-setup-option-title">{option.title}</h3>
                    <p className="home-setup-option-description">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="home-setup-button" disabled={!selected || userHasHome} onClick={handleContinue}>Continue</Button>
            <div className="home-setup-exit">
              <span><a href="#" onClick={navigateToLanding}>Exit to Login</a></span>|
              <span><a href="#" onClick={async () => {
                try {
                  const user = auth.currentUser;
                  const userRef = doc(db, "Users", user.uid);
                  await updateDoc(userRef, { twoFactorVerified: false });
                  await signOut(auth);
                  console.log('Logout successful');
                  navigate('/');
                } catch (error) {
                  console.error('Logout failed', error);
                }
              }}>Logout</a></span>
            </div>
          </>
        ) : selected === "create" ? (
          <>
            <div className="home-setup-header">
              {!homeCreated && (
                <img src={arrow} alt="back icon" className="home-back-button" onClick={() => setStep(1)} />
              )}
              <h2 className="home-setup-title">Create a New Home</h2>
            </div>
            {!homeCreated && !isUnderage && (
              <p className="home-setup-description">Enter a name for your home and create a unique Home ID. Share this ID with others to let them join your home.</p>
            )}
            {isUnderage && <p className="age-error">Sorry! You need to be 18 or older to become a home admin.</p>}
            <label>Home Name</label>
            <div className="input-container">
              <input
                type="text"
                placeholder="Myhome"
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                className={`home-setup-input ${homeCreated ? "home-setup-input-blue" : ""}`}
                disabled={homeCreated}
              />
            </div>
            {!homeCreated ? (
              <Button className="home-setup-button" onClick={handleCreateHome} disabled={!homeName || isUnderage}>Create Home</Button>
            ) : (
              <div>
                <hr className="line-separator" />
                <h3 className="home-success">✅ Home Created Successfully!</h3>
                <p>Your account is set as the Admin.</p>
                <p>Share this Home ID with others to let them join your home.</p>
                <div className="home-code-box">
                  <span>{generatedHomeId}</span>
                  <button onClick={() => copyToClipboard(generatedHomeId)} className="copy-button">Copy ID</button>
                </div>
                <Button onClick={() => { localStorage.removeItem("homeCreationInProgress"); navigate("/home"); }}>Go to Dashboard</Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="home-setup-header">
              <img src={arrow} alt="back icon" className="home-back-button" onClick={() => setStep(1)} />
              <h2 className="home-setup-title">Join a Home</h2>
            </div>
            <p className="home-setup-description">Enter the Home ID shared by Admin to join an existing home.</p>
            <label>Home ID</label>
            <div className="input-container">
              <input
                type="text"
                placeholder="home_123456"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className={error ? 'input-error' : 'input-blue'}
              />
              {error && <p className="error-message">{error}</p>} {/* Display error message */}
            </div>

            <Button className="home-setup-button" onClick={handleJoinHome} disabled={!joinCode}>Join Home</Button>
          </>
        )}
      </div>
    </div>
  );
}
