import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import PropTypes from "prop-types";
import { db } from "../pages/firebase";
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import DeviceCard from "../components/DeviceCard";
import { Plus, Zap, Lightbulb, Clock, Info } from 'lucide-react'; // Added Info icon for tooltips
import CircularSlider from "../components/CircularSlider";
import { useAuth } from "./AuthContext";
import { toggleDeviceStatus } from "../functions/shared/device";

const DeviceGrid = ({ homeId }) => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceStatus, setDeviceStatus] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const { user } = useAuth();
  const userId = user?.uid;
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!homeId) return;

      try {
        const devicesRef = collection(db, `Homes/${homeId}/devices`);
        const snapshot = await getDocs(devicesRef);
        const devicesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDevices(devicesData);

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

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!homeId || !userId) return;

      const homeRef = doc(db, "Homes", homeId);
      const homeSnap = await getDoc(homeRef);

      if (homeSnap.exists()) {
        const homeData = homeSnap.data();
        setPermissions(homeData.membersPermissions?.[userId] || {});
      } else {
        console.error("Home not found.");
      }
    };

    fetchPermissions();
  }, [homeId, userId]);

  const handleAddDevice = () => {
    if (!permissions.addDevice) {
      alert("You don't have permission to add a device.");
      return;
    }
    navigate(`/add-device/${homeId}`);
  };

  const handleAddScene = () => {
    if (!permissions.addScene) {
      alert("You don't have permission to add a scene.");
      return;
    }
    navigate(`/add-scene/${homeId}`);
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!permissions.removeDevice) {
      alert("You don't have permission to remove devices.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this device?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, `Homes/${homeId}/devices/${deviceId}`));
        setDevices((prevDevices) => prevDevices.filter((device) => device.id !== deviceId));
        setSelectedDevice(null);
        alert("Device deleted successfully!");
      } catch (error) {
        console.error("Error deleting device:", error);
        alert("Failed to delete device. Please try again.");
      }
    }
  };

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
  };

  const updateDevice = async (updatedDevice) => {
    const { id, ...deviceData } = updatedDevice;
    const deviceRef = doc(db, `Homes/${homeId}/devices/${id}`);

    try {
      await updateDoc(deviceRef, deviceData);
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.id === id ? { ...device, ...deviceData } : device
        )
      );
      setSelectedDevice(null);
    } catch (error) {
      console.error("Error updating device:", error);
    }
  };

  const handleTemperatureChange = (value) => {
    if (value < 0 || value > 30) return;
    setSelectedDevice((prevDevice) => ({
      ...prevDevice,
      temperature: { value },
    }));
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
    <div className="devices-container">
      {/* Home Overview Section */}
      <div className="home-overview-section">
        <h2 className="flex items-center gap-2">
          Home Overview
          <span className="tooltip">
            <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
            <span className="tooltip-text">A quick snapshot of your smart home's status, including connected devices, active scenes, and energy usage.</span>
          </span>
        </h2>
        <div className="overview-cards">
          <div className="overview-card">
            <Zap className="overview-icon" />
            <div>
              <h3>{devices.length}</h3>
              <p>Devices Connected</p>
            </div>
          </div>
          <div className="overview-card">
            <Lightbulb className="overview-icon" />
            <div>
              <h3>{scenes.length}</h3>
              <p>Scenes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Devices Section */}
      <div>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          Devices
          <span className="tooltip">
            <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
            <span className="tooltip-text">This is where you manage your smart devices. Add devices like lights, ACs, or appliances, and control them with a tap.</span>
          </span>
        </h2>
        <div>
          {devices.length === 0 ? (
            <div className="welcome-section">
              <div className="welcome-icon">
                <Zap className="w-16 h-16 text-[#347DC1] mb-4" />
              </div>
              <h3>Let’s Get Started!</h3>
              <p className="mb-2">You don’t have any devices yet. Add your first smart device to start controlling your home—like lights, ACs, or appliances—right from this page.</p>
              <p className="text-sm text-gray-500 mb-4">Tap the button below to add a device, then toggle it on/off or adjust settings with a tap.</p>
              <div className="flex justify-center mt-4">
                <button
                  className="flex flex-col bg-[#347DC1] rounded-lg shadow-md p-4 cursor-pointer hover:bg-[#347AB1] items-center justify-center transition-transform hover:scale-105"
                  onClick={handleAddDevice}
                  disabled={!permissions.addDevice}
                  aria-label="Add a new device to your smart home"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
                >
                  <Plus className="w-16 h-16 text-white" />
                  <span className="text-lg font-semibold text-white">Add Device</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Need help? <a href="/help" className="text-[#347DC1] underline">Check out our setup guide</a>.
              </p>
            </div>
          ) : (
            <div className="ml-2 mt-2 mr-2 grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onClick={() => handleDeviceClick(device)}
                  toggleDeviceStatus={() => toggleDeviceStatus(homeId, device.id, device.status, setDevices)}
                />
              ))}

              {/* Add Device Button (Mobile) */}
              <button
                className="fixed w-14 h-14 bg-[#347DC1] shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer z-[1000] transition-transform duration-[0.2s] rounded-[50%] border-[none] right-5 bottom-28 hover:scale-105 sm:hidden"
                onClick={handleAddDevice}
                disabled={!permissions.addDevice}
                aria-label="Add a new device to your smart home"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
              >
                <svg className="w-8 h-8 fill-[white]" xmlns="http://www.w3.org/2000/svg" viewBox="200 -700 600 600">
                  <path d="M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z" />
                </svg>
              </button>

              {/* Add Device Button (Desktop) */}
              <div
                className="hidden sm:flex flex-col bg-[#347DC1] rounded-lg shadow-md p-4 cursor-pointer hover:bg-[#347AB1] items-center justify-center transition-transform hover:scale-105"
                onClick={handleAddDevice}
                disabled={!permissions.addDevice}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
                aria-label="Add a new device to your smart home"
              >
                <Plus className="w-16 h-16 text-white" />
                <span className="text-lg font-semibold text-white">Add Device</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Device Details Popup */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <div className="flex items-center mb-4 space-x-2">
              <button onClick={() => setSelectedDevice(null)} aria-label="Close device details">
                <svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.4676 3.86208C21.3176 3.71172 21.1394 3.59243 20.9433 3.51103C20.7471 3.42964 20.5368 3.38774 20.3244 3.38774C20.1121 3.38774 19.9018 3.42964 19.7056 3.51103C19.5095 3.59243 19.3313 3.71172 19.1813 3.86208L8.44756 14.5958C8.32782 14.7153 8.23282 14.8573 8.16801 15.0135C8.10319 15.1698 8.06982 15.3373 8.06982 15.5065C8.06982 15.6756 8.10319 15.8431 8.16801 15.9994C8.23282 16.1556 8.32782 16.2976 8.44756 16.4171L19.1813 27.1508C19.8142 27.7838 20.8346 27.7838 21.4676 27.1508C22.1005 26.5179 22.1005 25.4975 21.4676 24.8646L12.1159 15.5L21.4805 6.13542C22.1005 5.51542 22.1005 4.48208 21.4676 3.86208Z" fill="black" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold">Device Details</h2>
            </div>
            <input
              type="text"
              value={selectedDevice.name}
              onChange={(e) =>
                setSelectedDevice({ ...selectedDevice, name: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg mb-4"
              aria-label="Device name"
            />
            <input
              type="text"
              value={selectedDevice.type}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-lg mb-4 bg-gray-100 cursor-not-allowed"
              aria-label="Device type (read-only)"
            />
            {selectedDevice.type === "Ac" && (
              <CircularSlider
                homeId={homeId}
                deviceId={selectedDevice.id}
                temperature={selectedDevice.temperature?.value || 24}
                setTemperature={handleTemperatureChange}
              />
            )}
            <div className="flex justify-center space-x-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                onClick={() => handleDeleteDevice(selectedDevice.id)}
                aria-label="Delete device"
              >
                Delete
              </button>
              <button
                onClick={() => updateDevice(selectedDevice)}
                className="px-4 py-2 bg-[#347DC1] text-white rounded-lg hover:bg-[#2a6ba5]"
                aria-label="Save device changes"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DeviceGrid.propTypes = {
  homeId: PropTypes.string.isRequired,
};

export default DeviceGrid;