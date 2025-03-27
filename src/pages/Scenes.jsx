import { useState, useEffect, useCallback } from 'react';
import { db } from "../pages/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import '../Styles/Scenes.css';
import DeviceSelectionList from '../components/DeviceSelectionList';
import SceneScheduler from '../components/SceneScheduler';
import scenesIcon from '../assets/scenes.svg';
import { useAuth } from "./AuthContext";
import { Clock } from 'lucide-react';
import { calculateEnergyConsumption } from '../functions/shared/device';

const Scenes = ({ homeId }) => {
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [sceneName, setSceneName] = useState('');
  const [scenes, setScenes] = useState([]);
  const [sceneType, setSceneType] = useState('TapToRun');
  const [triggerTime, setTriggerTime] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!homeId) return;

      try {
        // Fetch devices from the current home
        const devicesRef = collection(db, `Homes/${homeId}/devices`);
        const devicesSnapshot = await getDocs(devicesRef);
        const homeDevices = devicesSnapshot.docs.map(doc => ({
          id: doc.id,
          homeId: homeId,
          ...doc.data()
        }));
        setDevices(homeDevices);

        // Fetch scenes from the current home
        const scenesRef = collection(db, `Homes/${homeId}/scenes`);
        const scenesSnapshot = await getDocs(scenesRef);
        const scenesData = scenesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setScenes(scenesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (user && homeId) {
      fetchData();
    }
  }, [user, homeId]);

  const handleDeviceSelect = (device) => {
    setSelectedDevices([
      ...selectedDevices,
      {
        deviceId: device.id,
        homeId: device.homeId,
        action: 'Turn On',
        // For AC devices, store the temperature value from the device, or default to "24"
        ...(device.type === 'Ac' ? { 
          temperature: device.temperature?.value || "24" 
        } : {})
      }
    ]);
  };

  const handleDeviceActionChange = (deviceId, field, value) => {
    setSelectedDevices(selectedDevices.map(device => {
      if (device.deviceId === deviceId) {
        return { ...device, [field]: value };
      }
      return device;
    }));
  };

  const handleRemoveDevice = (deviceId) => {
    setSelectedDevices(selectedDevices.filter(device => device.deviceId !== deviceId));
  };

  const handleSave = async () => {
    if (!sceneName.trim()) {
      alert('Please enter a scene name');
      return;
    }

    if (selectedDevices.length === 0) {
      alert('Please select at least one device');
      return;
    }

    if (sceneType === 'Time' && !triggerTime) {
      alert('Please select a trigger time');
      return;
    }

    try {
      const scenesRef = collection(db, `Homes/${homeId}/scenes`);
      const newScene = {
        name: sceneName,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        type: sceneType,
        ...(sceneType === 'Time' && { triggerTime }),
        devices: selectedDevices.reduce((acc, device) => {
          acc[device.deviceId] = {
            homeId: device.homeId,
            action: device.action,
            // Store temperature as a string to match the device structure
            ...(device.temperature ? { temperature: device.temperature } : {})
          };
          return acc;
        }, {})
      };

      const docRef = doc(scenesRef);
      await setDoc(docRef, newScene);

      setScenes([...scenes, { id: docRef.id, ...newScene }]);
      setShowCreatePopup(false);
      setSceneName('');
      setSelectedDevices([]);
      setSceneType('TapToRun');
      setTriggerTime('');
    } catch (error) {
      console.error('Error saving scene:', error);
      alert('Failed to save scene');
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (window.confirm('Are you sure you want to delete this scene?')) {
      try {
        await deleteDoc(doc(db, `Homes/${homeId}/scenes`, sceneId));
        setScenes(scenes.filter(scene => scene.id !== sceneId));
      } catch (error) {
        console.error('Error deleting scene:', error);
        alert('Failed to delete scene');
      }
    }
  };

  const executeScene = useCallback(async (scene) => {
    try {
      // Get the current time for potential energy consumption records
      const now = new Date().toISOString();
      
      // Execute actions for each device in the scene
      for (const [deviceId, deviceAction] of Object.entries(scene.devices)) {
        const deviceRef = doc(db, `Homes/${deviceAction.homeId}/devices/${deviceId}`);
        const updates = {};

        // Find the current device state to determine what's changing
        const device = devices.find(d => d.id === deviceId);
        
        if (!device) {
          console.error(`Device ${deviceId} not found in local state`);
          continue;
        }

        if (deviceAction.action === 'Toggle') {
          // For toggle, we need to get the current device state
          updates.status = !device.status;
          {updates.status ? alert(`Turning on ${device.name}`) : alert(`Turning off ${device.name}`)}
        } else {
          if (device.status === (deviceAction.action === 'Turn On')) {
            // Skip if the device is already in the desired state
            alert(`Device ${device.name} is already ${deviceAction.action === 'Turn On' ? 'on' : 'off'}`);
            continue;
          }
          updates.status = deviceAction.action === 'Turn On';
          alert(`Turning ${updates.status ? 'on' : 'off'} ${device.name}`);
        }

        // Handle temperature for AC devices - maintain the temperature object structure
        if (deviceAction.temperature !== undefined) {
          updates.temperature = { value: deviceAction.temperature };
        }

        // Update the device in Firestore
        await updateDoc(deviceRef, updates);

        // Update local devices state
        setDevices(devices.map(d => {
          if (d.id === deviceId) {
            return { ...d, ...updates };
          }
          return d;
        }));

        const dailyDocRef = doc(db, `Homes/${homeId}/devices/${deviceId}/energyConsumption/daily`);
        const monthlyDocRef = doc(db, `Homes/${homeId}/devices/${deviceId}/energyConsumption/monthly`);
        const yearlyDocRef = doc(db, `Homes/${homeId}/devices/${deviceId}/energyConsumption/yearly`);

        const dailyDocSnap = await getDoc(dailyDocRef);
        const dailyData = dailyDocSnap.exists() ? dailyDocSnap.data() : {};
        const localtime = new Date().toLocaleString("en-CA", { timeZone: "Asia/Dubai", hour12: false }).replace(",", "");
        const localtoday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }).split(",")[0];

        if (updates.status) {
          // **Turning ON**: Append new session with start time using arrayUnion
          await updateDoc(dailyDocRef, {
            [`${localtoday}.sessions`]: arrayUnion({ start: localtime })
          });
          console.log("Started tracking energy session at:", localtime);
        } else {
          if (!dailyData) {
            console.error("No previous data found.");
            return;
          }

          // Get device power rating
          const deviceDocSnap = await getDoc(deviceRef);
          const powerRating_kW = deviceDocSnap.exists() ? deviceDocSnap.data().powerRating_kW : 0;

          // Find last session without an `end` timestamp
          let startTime = null;
          let updatedSessions = dailyData[localtoday]?.sessions || [];

          if (updatedSessions.length > 0) {
            const lastSessionIndex = updatedSessions.length - 1;
            if (!updatedSessions[lastSessionIndex].end) {
              startTime = updatedSessions[lastSessionIndex].start;
            }
          }

          if (startTime) {
            await calculateEnergyConsumption(startTime, localtime, powerRating_kW, dailyDocRef, monthlyDocRef, yearlyDocRef, dailyData, homeId);
          } else {
            console.error("No valid start timestamp found.");
          }
        }
      }
      alert('Scene executed successfully');
    } catch (error) {
      console.error('Error executing scene:', error);
      alert('Failed to execute scene');
    }
  }, [devices]);

  const getTaskCount = (scene) => {
    return Object.keys(scene.devices || {}).length;
  };

  const getRandomColor = (index) => {
    const colors = [
      'bg-gradient-to-br from-amber-400 to-amber-300',
      'bg-gradient-to-br from-green-400 to-green-300',
      'bg-gradient-to-br from-blue-400 to-blue-300',
      'bg-gradient-to-br from-red-400 to-red-300',
      'bg-gradient-to-br from-fuchsia-400 to-fuchsia-300',
      'bg-gradient-to-br from-purple-400 to-purple-300'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="scenes-container">
      <SceneScheduler homeId={homeId} executeScene={executeScene} />
      <div className="scenes-grid">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className={`scene-card ${getRandomColor(index)}`}
            onClick={scene.type === 'TapToRun' ? () => executeScene(scene) : undefined}
          >
            <div className="scene-card-header">
              <div className="scene-icon">
                {scene.type === 'Time' ? (
                  <Clock className="w-8 h-8 text-white" />
                ) : (
                  <img src={scenesIcon} alt="Scene" className="w-8 h-8 filter brightness-0 invert" />
                )}
              </div>
              <div className="scene-actions">
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteScene(scene.id);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="scene-info">
              <h3 className="scene-title">{scene.name}</h3>
              {scene.type === 'Time' && (
                <p className="scene-time">{scene.triggerTime}</p>
              )}
              <p className="scene-tasks">{getTaskCount(scene)} tasks</p>
            </div>
          </div>
        ))}
      </div>

      <button
        className="fixed w-14 h-14 bg-[#347DC1] shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer z-[1000] transition-transform duration-[0.2s] rounded-[50%] border-[none] right-5 bottom-28 hover:scale-105"
        onClick={() => setShowCreatePopup(true)} // Permission check (add device)
      >
        <svg className="w-8 h-8 fill-[white]" xmlns="http://www.w3.org/2000/svg" viewBox="200 -700 600 600">
          <path d="M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z" />
        </svg>
      </button>

      {showCreatePopup && (
        <div className="create-scene-popup">
          <div className="popup-content">
            <div className="popup-header">
              <h2 className="popup-title">Create Scene</h2>
              <button
                className="close-button-scene"
                onClick={() => {
                  setShowCreatePopup(false);
                  setSceneName('');
                  setSelectedDevices([]);
                  setSceneType('TapToRun');
                  setTriggerTime('');
                }}
              >
                ×
              </button>
            </div>

            <div className="scene-form">
              <input
                type="text"
                placeholder="Enter scene name"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                className="scene-name-input"
              />

              <div className="scene-type-selector">
                <div className="scene-type-options">
                  <button
                    className={`scene-type-button ${sceneType === 'TapToRun' ? 'active' : ''}`}
                    onClick={() => setSceneType('TapToRun')}
                  >
                    TapToRun
                  </button>
                  <button
                    className={`scene-type-button ${sceneType === 'Time' ? 'active' : ''}`}
                    onClick={() => setSceneType('Time')}
                  >
                    Time
                  </button>
                </div>
                {sceneType === 'Time' && (
                  <input
                    type="time"
                    value={triggerTime}
                    onChange={(e) => setTriggerTime(e.target.value)}
                    className="time-picker"
                  />
                )}
              </div>

              <DeviceSelectionList
                devices={devices}
                selectedDevices={selectedDevices}
                onDeviceSelect={handleDeviceSelect}
                onDeviceActionChange={handleDeviceActionChange}
                onRemoveDevice={handleRemoveDevice}
              />

              <button className="save-button" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scenes;