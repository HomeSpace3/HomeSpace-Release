import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart, Bar, XAxis as BarXAxis, YAxis as BarYAxis, CartesianGrid as BarCartesianGrid, Tooltip as BarTooltip, Legend as BarLegend } from "recharts";
import { db } from "../pages/firebase";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { Zap, Info } from "lucide-react";
import '../styles/Energy.css';

// Fetch Devices for the Home
const fetchDevices = async (homeId) => {
  const devicesSnapshot = await getDocs(collection(db, "Homes", homeId, "devices"));
  const fetchedDevices = devicesSnapshot.docs.map(doc => {
    const deviceData = doc.data();
    console.log("Fetched device:", deviceData); // Log the device data
    return {
      id: doc.id,
      name: deviceData.name,  // Ensure device has a name field
      ...deviceData,
    };
  });
  return fetchedDevices;
};

const fetchEnergyRecords = async (homeId) => {
  try {
    const dailyRef = doc(db, "Homes", homeId, "energyRecords", "daily");
    const monthlyRef = doc(db, "Homes", homeId, "energyRecords", "monthly");
    const yearlyRef = doc(db, "Homes", homeId, "energyRecords", "yearly");

    const [dailySnap, monthlySnap, yearlySnap] = await Promise.all([
      getDoc(dailyRef),
      getDoc(monthlyRef),
      getDoc(yearlyRef),
    ]);

    console.log("yearly snap", yearlySnap.data());
    console.log("monthly snap", monthlySnap.data());
    console.log("daily snap", dailySnap.data());

    return {
      daily: dailySnap.exists() ? dailySnap.data() : {},
      monthly: monthlySnap.exists() ? monthlySnap.data() : {},
      yearly: yearlySnap.exists() ? yearlySnap.data() : {},
    };
  } catch (error) {
    console.error("Error fetching energy records:", error);
    return { daily: {}, monthly: {}, yearly: {} };
  }
};

const fetchConsumptionData = async (homeId, deviceId) => {
  const consumptionRef = collection(db, "Homes", homeId, "devices", deviceId, "energyConsumption");
  const consumptionSnapshot = await getDocs(consumptionRef);

  let consumptionData = {
    daily: {},
    monthly: {},
    yearly: {},
  };

  consumptionSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    console.log(doc.id);
    console.log("Fetched data from Firestore:", data);  // Log the raw data

    // Handle daily data (e.g., "2025-03-09": 25, currentConsumption: 10)
    if (doc.id === "daily") {

      const dailyData = doc.data() || {};
      Object.entries(dailyData).forEach(([day, value]) => {
        consumptionData.daily[day] = value;
      });
    }

    // Handle monthly data (e.g., "2025-03": 35)
    if (doc.id === "monthly") {
      Object.entries(doc.data()).forEach(([month, value]) => {
        consumptionData.monthly[month] = value;
      });
    }

    // Handle yearly data (e.g., "2025": 35)
    if (doc.id === "yearly") {
      Object.entries(doc.data()).forEach(([year, value]) => {
        consumptionData.yearly[year] = value;
      });
    }
  });

  console.log('Fetched consumption data:', consumptionData);  // Log the structured data
  return consumptionData;
};

// Generate a range of dates for the chart
const generateDateRange = (tab) => {
  const dates = [];
  const today = new Date();

  if (tab === "daily") {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split("T")[0]); // YYYY-MM-DD
    }
  } else if (tab === "monthly") {
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      dates.push(date.toISOString().split("T")[0].slice(0, 7)); // YYYY-MM
    }
  } else if (tab === "yearly") {
    // Last 3 years
    for (let i = 2; i >= 0; i--) {
      const year = today.getFullYear() - i;
      dates.push(year.toString()); // YYYY
    }
  }

  return dates;
};

// Energy Saving Tips
const energySavingTips = [
  "Turn off devices when not in use to save up to 30% on energy bills.",
  "Consider upgrading to energy-efficient appliances.",
  "Use a programmable thermostat to control heating and cooling.",
  "Switch to LED bulbs to reduce energy consumption.",
  "Unplug electronics when they are not in use to avoid 'phantom' energy waste."
];

const Energy = ({ homeId }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [energyData, setEnergyData] = useState({ daily: {}, monthly: {}, yearly: {} });
  const [selectedTab, setSelectedTab] = useState("daily");
  const [savedEnergy, setSavedEnergy] = useState(15); // Example energy saved (in kWh)
  const [loading, setLoading] = useState(true);
  const [maxY, setMaxY] = useState(2); // Default max Y value

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedDevices = await fetchDevices(homeId); // Fetching devices for the specific home
        const energyRecords = await fetchEnergyRecords(homeId);
        console.log("Fetched energy:", energyRecords); // Check if devices are fetched
        console.log("Fetched devices:", fetchedDevices); // Check if devices are fetched
        setDevices(fetchedDevices);
        setEnergyData(energyRecords);
        updateYAxisDomain(energyRecords);
        console.log("Devices state after setting:", fetchedDevices);
        if (fetchedDevices.length > 0) {
          const consumptionDataPromises = fetchedDevices.map(async (device) => {
            const consumptionData = await fetchConsumptionData(homeId, device.id); // Pass homeId and deviceId
            console.log(`Fetched consumption data for device ${device.id}:`, consumptionData);
            return { ...device, consumptionData };
          });
          const devicesWithConsumptionData = await Promise.all(consumptionDataPromises);
          setDevices(devicesWithConsumptionData);
        }
        updateYAxisDomain(energyRecords);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [homeId]);

  const getTodayConsumption = (dailyData) => {
    const todayDate = new Date().toISOString().split("T")[0];
    const todayData = dailyData[todayDate];
    console.log("Today's consumption:", todayData);
    return todayData ? todayData.total : 0;  // Return 0 if no data is found
  };

  const getYesterdayConsumption = (dailyData) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];  // Get yesterday's date
    const yesterdayData = dailyData[yesterdayDate];
    console.log("Yesterday's consumption:", yesterdayData);
    return yesterdayData ? yesterdayData.total : 0;  // Return 0 if no data is found
  };

  const getThisMonthConsumption = (monthlyData) => {
    const currentMonth = new Date().toISOString().split("T")[0].slice(0, 7);  // Get the current month in YYYY-MM
    const monthlyConsumption = monthlyData[currentMonth];
    console.log("This month's consumption:", monthlyConsumption);
    console.log("This month's consumption:", monthlyConsumption ? monthlyConsumption.total : 0);
    return monthlyConsumption ? monthlyConsumption.total : 0;  // Return 0 if no data is found
  };

  const getCurrentData = () => {
    const dateRange = generateDateRange(selectedTab);
    let data;
  
    if (selectedDevice) {
      const deviceData = selectedDevice.consumptionData[selectedTab];
      console.log('Selected device consumption data:', deviceData);
      data = dateRange.map((date) => {
        const value = deviceData && deviceData[date] ? deviceData[date].total : 0;
        console.log(`Date: ${date}, Value: ${value}`); // Log each date and its value
        return {
          [selectedTab === "daily" ? "day" : selectedTab === "monthly" ? "month" : "year"]: date,
          value,
        };
      });
    } else {
      const energyRecords = energyData[selectedTab];
      console.log('Fetched energy records:', energyRecords);
      data = dateRange.map((date) => {
        const value = energyRecords && energyRecords[date] ? energyRecords[date].total : 0;
        console.log(`Date: ${date}, Value: ${value}`); // Log each date and its value
        return {
          [selectedTab === "daily" ? "day" : selectedTab === "monthly" ? "month" : "year"]: date,
          value,
        };
      });
    }
  
    console.log("Current data for line chart:", data);
    return data;
  };

  // Function to calculate the device with the highest energy consumption
  const getHighestConsumptionDevice = () => {
    let highestDevice = null;
    let highestConsumption = 0;

    devices.forEach((device) => {
      if (device.consumptionData) {
        const dailyConsumption = getTodayConsumption(device.consumptionData.daily);
        const monthlyConsumption = getThisMonthConsumption(device.consumptionData.monthly);
        const totalConsumption = dailyConsumption + monthlyConsumption;
        if (totalConsumption > highestConsumption) {
          highestConsumption = totalConsumption;
          highestDevice = device;
        }
      }
    });

    return highestDevice;
  };

  const highestConsumptionDevice = getHighestConsumptionDevice();

  // Determine Y-axis domain based on selected device or all devices
  const updateYAxisDomain = (data) => {
    let maxValue = 0;
    if (selectedDevice) {
      const deviceData = selectedDevice.consumptionData[selectedTab];
      if (deviceData) {
        maxValue = Math.max(...Object.values(deviceData).map(d => d.total || 0));
      }
    } else {
      const energyDataValues = Object.values(data[selectedTab] || {}).map(d => d.total || 0);
      maxValue = Math.max(...energyDataValues);
    }
    // Ensure a minimum maxY for better visualization
    setMaxY(Math.max(2, maxValue + (maxValue * 0.2))); // 20% buffer
  };

  return (
    <div className="energy-container">
      <h1 className="text-2xl font-semibold mb-6 text-center">Energy Dashboard</h1>

      {/* Energy Saving Indicator */}
      <div className="energy-saved-section">
        <h2 className="flex items-center gap-2">Total Energy Saved
          <span className="tooltip">
            <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
            <span className="tooltip-text">This shows the total energy you've saved by optimizing device usage.</span>
          </span>
        </h2>
        <div className="energy-saved-content">
          {/* Static progress bar */}
          <div className="energy-saved-bar">
            <div
              style={{ width: `${savedEnergy}%` }}
              className="energy-saved-fill"
            ></div>
          </div>
          <span className="energy-saved-value">{savedEnergy} kWh</span>
        </div>
        <p className="energy-saved-message">Great job! Keep optimizing your device usage to save more energy.</p>
      </div>

      <div className="consumption-section">
        <div className="consumption-header">
          <h2 className="flex items-center gap-2">
            {selectedDevice ? selectedDevice.name : "All Devices"} Consumption
            <span className="tooltip">
              <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
              <span className="tooltip-text">View energy consumption over time for all devices or a specific device.</span>
            </span>
          </h2>
          <div className="consumption-controls">
            <div className="tabs">
              {["daily", "monthly", "yearly"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={selectedTab === tab ? "active" : ""}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <select
              className="px-4 py-2 border rounded-md border-blue-500"
              value={selectedDevice ? selectedDevice.id : "all"}
              onChange={(e) => setSelectedDevice(e.target.value === "all" ? null : devices.find(device => device.id === e.target.value))}
            >
              <option value="all">All Devices</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>{device.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="chart-container">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getCurrentData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey={selectedTab === "daily" ? "day" : selectedTab === "monthly" ? "month" : "year"}
                  tickFormatter={(value) => {
                    if (selectedTab === "daily") return value.split("-").slice(1).join("-");
                    if (selectedTab === "monthly") return value.split("-").slice(1).join("-");
                    return value;
                  }}
                />
                <YAxis
                  domain={[0, maxY]}
                  tickCount={5}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip labelFormatter={(label) => {
                  if (selectedTab === "daily") return `Day: ${label.split("-").slice(1).join("-")}`;
                  if (selectedTab === "monthly") return `Month: ${label.split("-").slice(1).join("-")}`;
                  return `Year: ${label}`;
                }} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#347DC1" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Energy Saving Tips */}
      <div className="tips-section">
        <h2 className="flex items-center gap-2">
          Energy Saving Tips
          <span className="tooltip">
            <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
            <span className="tooltip-text">Follow these tips to reduce your energy consumption and save on bills.</span>
          </span>
        </h2>
        <div className="tips-list">
          {energySavingTips.map((tip, index) => (
            <div key={index} className="tip-card">
              <Zap className="tip-icon" />
              <p>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart for Energy Comparison */}
      {devices.length > 0 && (
        <div className="comparison-section">
          <h2 className="flex items-center gap-2">
            Energy Consumption Comparison - Per Device
            <span className="tooltip">
              <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
              <span className="tooltip-text">Compare energy usage across devices for today, yesterday, and this month.</span>
            </span>
          </h2>
          <div className="chart-container">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={devices.map(device => ({
                  device: device.name,
                  today: getTodayConsumption(device.consumptionData?.daily || []),
                  yesterday: getYesterdayConsumption(device.consumptionData?.daily || []),
                  thisMonth: getThisMonthConsumption(device.consumptionData?.monthly || []),
                }))}>
                  <BarCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <BarXAxis dataKey="device" />
                  <BarYAxis
                    domain={[0, maxY]}
                    tickCount={5}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <BarTooltip />
                  <BarTooltip formatter={(value) => `${value.toFixed(2)} kWh`} />
                  <BarLegend />
                  <Bar dataKey="today" fill="#347DC1" name="Today" />
                  <Bar dataKey="yesterday" fill="#82ca9d" name="Yesterday" />
                  <Bar dataKey="thisMonth" fill="#facc15" name="This Month" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Insights */}
      {devices.length > 0 && (
        <div className="insights-section">
          <h2 className="flex items-center gap-2">
            Energy Insights
            <span className="tooltip">
              <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
              <span className="tooltip-text">Insights based on your energy consumption patterns.</span>
            </span>
          </h2>
          <p>
            {highestConsumptionDevice
              ? `${highestConsumptionDevice.name} consumes the highest energy overall. Consider optimizing its usage by setting a timer or using an energy-efficient mode.`
              : "No significant consumption data available yet. Use your devices to generate insights."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Energy;


// import React, { useState, useEffect } from "react";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
// import { BarChart, Bar, XAxis as BarXAxis, YAxis as BarYAxis, CartesianGrid as BarCartesianGrid, Tooltip as BarTooltip, Legend as BarLegend } from "recharts";
// import { db } from "../pages/firebase";
// import { collection, doc, getDocs, getDoc } from "firebase/firestore";
// import { Zap, Info, Loader2 } from "lucide-react";
// import '../styles/Energy.css';

// // Fetch Devices for the Home
// const fetchDevices = async (homeId) => {
//   const devicesSnapshot = await getDocs(collection(db, "Homes", homeId, "devices"));
//   const fetchedDevices = devicesSnapshot.docs.map(doc => {
//     const deviceData = doc.data();
//     console.log("Fetched device:", deviceData);
//     return {
//       id: doc.id,
//       name: deviceData.name,
//       ...deviceData,
//     };
//   });
//   return fetchedDevices;
// };

// // Fetch Energy Records
// const fetchEnergyRecords = async (homeId) => {
//   try {
//     const dailyRef = doc(db, "Homes", homeId, "energyRecords", "daily");
//     const monthlyRef = doc(db, "Homes", homeId, "energyRecords", "monthly");
//     const yearlyRef = doc(db, "Homes", homeId, "energyRecords", "yearly");

//     const [dailySnap, monthlySnap, yearlySnap] = await Promise.all([
//       getDoc(dailyRef),
//       getDoc(monthlyRef),
//       getDoc(yearlyRef),
//     ]);

//     console.log("yearly snap", yearlySnap.data());
//     console.log("monthly snap", monthlySnap.data());
//     console.log("daily snap", dailySnap.data());

//     return {
//       daily: dailySnap.exists() ? dailySnap.data() : {},
//       monthly: monthlySnap.exists() ? monthlySnap.data() : {},
//       yearly: yearlySnap.exists() ? yearlySnap.data() : {},
//     };
//   } catch (error) {
//     console.error("Error fetching energy records:", error);
//     return { daily: {}, monthly: {}, yearly: {} };
//   }
// };

// // Fetch Consumption Data
// const fetchConsumptionData = async (homeId, deviceId) => {
//   const consumptionRef = collection(db, "Homes", homeId, "devices", deviceId, "energyConsumption");
//   const consumptionSnapshot = await getDocs(consumptionRef);

//   let consumptionData = {
//     daily: {},
//     weekly: {},
//     monthly: {},
//     yearly: {},
//   };

//   consumptionSnapshot.docs.forEach((doc) => {
//     const data = doc.data();
//     console.log(doc.id);
//     console.log("Fetched data from Firestore:", data);

//     if (doc.id === "daily") {
//       consumptionData.daily = data || {};
//     }
//     if (doc.id === "weekly") {
//       Object.entries(doc.data()).forEach(([day, value]) => {
//         consumptionData.weekly[day] = value;
//       });
//     }
//     if (doc.id === "monthly") {
//       Object.entries(doc.data()).forEach(([month, value]) => {
//         consumptionData.monthly[month] = value;
//       });
//     }
//     if (doc.id === "yearly") {
//       Object.entries(doc.data()).forEach(([year, value]) => {
//         consumptionData.yearly[year] = value;
//       });
//     }
//   });

//   console.log('Fetched consumption data:', consumptionData);
//   return consumptionData;
// };

// // Generate a range of dates for the chart
// const generateDateRange = (tab) => {
//   const dates = [];
//   const today = new Date();

//   if (tab === "daily") {
//     for (let i = 0; i < 24; i++) {
//       const date = new Date(today);
//       date.setHours(i, 0, 0, 0);
//       dates.push(date.toISOString());
//     }
//   } else if (tab === "weekly") {
//     const startOfWeek = new Date(today);
//     startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
//     for (let i = 0; i < 7; i++) {
//       const date = new Date(startOfWeek);
//       date.setDate(startOfWeek.getDate() + i);
//       dates.push(date.toISOString().split("T")[0]);
//     }
//   } else if (tab === "monthly") {
//     const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//     const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//     for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
//       dates.push(new Date(d).toISOString().split("T")[0]);
//     }
//   } else if (tab === "yearly") {
//     for (let i = 0; i < 12; i++) {
//       const date = new Date(today.getFullYear(), i, 1);
//       dates.push(date.toISOString().split("T")[0].slice(0, 7));
//     }
//   }

//   return dates;
// };

// // Energy Saving Tips
// const energySavingTips = [
//   "Turn off devices when not in use to save up to 30% on energy bills.",
//   "Consider upgrading to energy-efficient appliances.",
//   "Use a programmable thermostat to control heating and cooling.",
//   "Switch to LED bulbs to reduce energy consumption.",
//   "Unplug electronics when they are not in use to avoid 'phantom' energy waste."
// ];

// const Energy = ({ homeId }) => {
//   const [devices, setDevices] = useState([]);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [energyData, setEnergyData] = useState({ daily: {}, monthly: {}, yearly: {} });
//   const [selectedTab, setSelectedTab] = useState("daily");
//   const [savedEnergy, setSavedEnergy] = useState(15);
//   const [loading, setLoading] = useState(true);
//   const [maxY, setMaxY] = useState(2);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const fetchedDevices = await fetchDevices(homeId);
//         const energyRecords = await fetchEnergyRecords(homeId);
//         console.log("Fetched energy:", energyRecords);
//         console.log("Fetched devices:", fetchedDevices);
//         setDevices(fetchedDevices);
//         setEnergyData(energyRecords);
//         if (fetchedDevices.length > 0) {
//           const consumptionDataPromises = fetchedDevices.map(async (device) => {
//             const consumptionData = await fetchConsumptionData(homeId, device.id);
//             console.log(`Fetched consumption data for device ${device.id}:`, consumptionData);
//             return { ...device, consumptionData };
//           });
//           const devicesWithConsumptionData = await Promise.all(consumptionDataPromises);
//           setDevices(devicesWithConsumptionData);
//         }
//         updateYAxisDomain(energyRecords);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [homeId]);

//   const getTodayConsumption = (dailyData) => {
//     const todayDate = new Date().toISOString().split("T")[0];
//     const todayData = dailyData[todayDate];
//     console.log("Today's consumption:", todayData);
//     return todayData && todayData.total ? todayData.total : 0;
//   };

//   const getYesterdayConsumption = (dailyData) => {
//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
//     const yesterdayDate = yesterday.toISOString().split("T")[0];
//     const yesterdayData = dailyData[yesterdayDate];
//     console.log("Yesterday's consumption:", yesterdayData);
//     return yesterdayData && yesterdayData.total ? yesterdayData.total : 0;
//   };

//   const getThisMonthConsumption = (monthlyData) => {
//     const currentMonth = new Date().toISOString().split("T")[0].slice(0, 7);
//     const monthlyConsumption = monthlyData[currentMonth];
//     console.log("This month's consumption:", monthlyConsumption);
//     return monthlyConsumption && monthlyConsumption.total ? monthlyConsumption.total : 0;
//   };

//   const getCurrentData = () => {
//     const dateRange = generateDateRange(selectedTab);
//     let data;

//     if (selectedDevice) {
//       const deviceData = selectedDevice.consumptionData[selectedTab];
//       console.log('Selected device consumption data:', deviceData);

//       if (selectedTab === "daily") {
//         const today = new Date().toISOString().split("T")[0];
//         const dailyData = deviceData && deviceData[today] ? deviceData[today] : {};
//         const isHourlyData = dailyData && Object.keys(dailyData).some(key => key.includes(":"));
//         if (isHourlyData) {
//           data = dateRange.map((isoDate) => {
//             const hour = new Date(isoDate).getHours().toString().padStart(2, "0") + ":00";
//             const value = dailyData[hour] ? dailyData[hour].total : 0;
//             return { hour, value };
//           });
//         } else {
//           const dailyTotal = dailyData.total || 0;
//           data = dateRange.map((isoDate) => {
//             const hour = new Date(isoDate).getHours().toString().padStart(2, "0") + ":00";
//             return { hour, value: dailyTotal / 24 };
//           });
//         }
//       } else if (selectedTab === "weekly") {
//         data = dateRange.map((date) => ({
//           day: date,
//           value: deviceData && deviceData[date] ? deviceData[date].total : 0,
//         }));
//       } else if (selectedTab === "monthly") {
//         data = dateRange.map((date) => ({
//           day: date,
//           value: deviceData && deviceData[date] ? deviceData[date].total : 0,
//         }));
//       } else if (selectedTab === "yearly") {
//         data = dateRange.map((month) => ({
//           month,
//           value: deviceData && deviceData[month] ? deviceData[month].total : 0,
//         }));
//       }
//     } else {
//       const energyRecords = energyData[selectedTab];
//       console.log('Fetched energy records:', energyRecords);

//       if (selectedTab === "daily") {
//         const today = new Date().toISOString().split("T")[0];
//         const dailyData = energyRecords && energyRecords[today] ? energyRecords[today] : {};
//         const isHourlyData = dailyData && Object.keys(dailyData).some(key => key.includes(":"));
//         if (isHourlyData) {
//           data = dateRange.map((isoDate) => {
//             const hour = new Date(isoDate).getHours().toString().padStart(2, "0") + ":00";
//             const value = dailyData[hour] ? dailyData[hour].total : 0;
//             return { hour, value };
//           });
//         } else {
//           const dailyTotal = dailyData.total || 0;
//           data = dateRange.map((isoDate) => {
//             const hour = new Date(isoDate).getHours().toString().padStart(2, "0") + ":00";
//             return { hour, value: dailyTotal / 24 };
//           });
//         }
//       } else if (selectedTab === "weekly") {
//         data = dateRange.map((date) => ({
//           day: date,
//           value: energyRecords && energyRecords[date] ? energyRecords[date].total : 0,
//         }));
//       } else if (selectedTab === "monthly") {
//         data = dateRange.map((date) => ({
//           day: date,
//           value: energyRecords && energyRecords[date] ? energyRecords[date].total : 0,
//         }));
//       } else if (selectedTab === "yearly") {
//         data = dateRange.map((month) => ({
//           month,
//           value: energyRecords && energyRecords[month] ? energyRecords[month].total : 0,
//         }));
//       }
//     }

//     console.log("Current data for line chart:", data);
//     return data;
//   };

//   const getHighestConsumptionDevice = () => {
//     let highestDevice = null;
//     let highestConsumption = 0;

//     devices.forEach((device) => {
//       if (device.consumptionData) {
//         const dailyConsumption = getTodayConsumption(device.consumptionData.daily);
//         const monthlyConsumption = getThisMonthConsumption(device.consumptionData.monthly);
//         const totalConsumption = dailyConsumption + monthlyConsumption;
//         if (totalConsumption > highestConsumption) {
//           highestConsumption = totalConsumption;
//           highestDevice = device;
//         }
//       }
//     });

//     return highestDevice;
//   };

//   const highestConsumptionDevice = getHighestConsumptionDevice();

//   const updateYAxisDomain = (data) => {
//     let maxValue = 0;
//     if (selectedDevice) {
//       const deviceData = selectedDevice.consumptionData[selectedTab];
//       if (deviceData) {
//         if (selectedTab === "daily") {
//           const today = new Date().toISOString().split("T")[0];
//           const dailyData = deviceData[today] || {};
//           const isHourlyData = dailyData && Object.keys(dailyData).some(key => key.includes(":"));
//           if (isHourlyData) {
//             maxValue = Math.max(...Object.values(dailyData).map(d => d.total || 0));
//           } else {
//             maxValue = dailyData.total || 0;
//           }
//         } else {
//           maxValue = Math.max(...Object.values(deviceData).map(d => d.total || 0));
//         }
//       }
//     } else {
//       const energyRecords = data[selectedTab] || {};
//       if (selectedTab === "daily") {
//         const today = new Date().toISOString().split("T")[0];
//         const dailyData = energyRecords[today] || {};
//         const isHourlyData = dailyData && Object.keys(dailyData).some(key => key.includes(":"));
//         if (isHourlyData) {
//           maxValue = Math.max(...Object.values(dailyData).map(d => d.total || 0));
//         } else {
//           maxValue = dailyData.total || 0;
//         }
//       } else {
//         maxValue = Math.max(...Object.values(energyRecords).map(d => d.total || 0));
//       }
//     }
//     setMaxY(Math.max(2, maxValue + (maxValue * 0.2)));
//   };

//   return (
//     <div className="energy-container">
//       <h1 className="text-2xl font-semibold mb-6 text-center">Energy Dashboard</h1>

//       {/* Energy Saving Indicator */}
//       <div className="energy-saved-section">
//         <h2 className="flex items-center gap-2">
//           Total Energy Saved
//           <span className="tooltip">
//             <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
//             <span className="tooltip-text">This shows the total energy you've saved by optimizing device usage.</span>
//           </span>
//         </h2>
//         <div className="energy-saved-content">
//           <div className="energy-saved-bar">
//             <div style={{ width: `${savedEnergy}%` }} className="energy-saved-fill"></div>
//           </div>
//           <span className="energy-saved-value">{savedEnergy} kWh</span>
//         </div>
//         <p className="energy-saved-message">Great job! Keep optimizing your device usage to save more energy.</p>
//       </div>

//       {/* Consumption Section */}
//       <div className="consumption-section">
//         <div className="consumption-header">
//           <h2 className="flex items-center gap-2">
//             {selectedDevice ? selectedDevice.name : "All Devices"} Consumption
//             <span className="tooltip">
//               <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
//               <span className="tooltip-text">View energy consumption over time for all devices or a specific device.</span>
//             </span>
//           </h2>
//           <div className="consumption-controls">
//             <div className="tabs">
//               {["daily", "weekly", "monthly", "yearly"].map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => setSelectedTab(tab)}
//                   className={selectedTab === tab ? "active" : ""}
//                 >
//                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                 </button>
//               ))}
//             </div>
//             <select
//               className="device-selector"
//               value={selectedDevice ? selectedDevice.id : "all"}
//               onChange={(e) => setSelectedDevice(e.target.value === "all" ? null : devices.find(device => device.id === e.target.value))}
//             >
//               <option value="all">All Devices</option>
//               {devices.map((device) => (
//                 <option key={device.id} value={device.id}>{device.name}</option>
//               ))}
//             </select>
//           </div>
//         </div>
//         <div className="chart-container">
//           {loading ? (
//             <div className="loading">
//               <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
//               <span>Loading data...</span>
//             </div>
//           ) : getCurrentData().length === 0 ? (
//             <div className="no-data">No consumption data available for this period.</div>
//           ) : (
//             <ResponsiveContainer width="100%" height={window.innerWidth <= 640 ? 250 : 300}>
//               <LineChart data={getCurrentData()} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
//                 <XAxis
//                   dataKey={selectedTab === "daily" ? "hour" : selectedTab === "weekly" ? "day" : selectedTab === "monthly" ? "day" : "month"}
//                   interval={selectedTab === "daily" ? 1 : selectedTab === "weekly" ? 0 : selectedTab === "monthly" ? 4 : 0} // Show every 2nd hour for daily, every day for weekly, every 5th day for monthly, every month for yearly
//                   tickFormatter={(value) => {
//                     if (selectedTab === "daily") return value.split(":")[0]; // Show hour (e.g., "00", "01", ..., "23")
//                     if (selectedTab === "weekly") {
//                       const date = new Date(value);
//                       return date.toLocaleString("en-US", { weekday: "short" }); // Show day of week (e.g., "Mon", "Tue")
//                     }
//                     if (selectedTab === "monthly") return value.split("-")[2]; // Show day of month (e.g., "01", "02", ..., "31")
//                     if (selectedTab === "yearly") return value.split("-")[1]; // Show month (e.g., "01", "02", ..., "12")
//                   }}
//                   stroke="#4b5563"
//                   tick={{ fontSize: window.innerWidth <= 640 ? 10 : 12 }} // Smaller font size on mobile
//                 />
//                 <YAxis
//                   domain={[0, maxY]}
//                   tickCount={5}
//                   tickFormatter={(value) => value.toFixed(1)}
//                   stroke="#4b5563"
//                   tick={{ fontSize: window.innerWidth <= 640 ? 10 : 12 }}
//                 />
//                 <Tooltip
//                   contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
//                   formatter={(value) => `${value.toFixed(2)} kWh`}
//                   labelFormatter={(label) => {
//                     if (selectedTab === "daily") return `Hour: ${label}`;
//                     if (selectedTab === "weekly") return `Day: ${new Date(label).toLocaleString("en-US", { weekday: "long" })}`;
//                     if (selectedTab === "monthly") return `Day: ${label.split("-")[2]}`;
//                     if (selectedTab === "yearly") return `Month: ${new Date(label + "-01").toLocaleString("en-US", { month: "long" })}`;
//                   }}
//                 />
//                 <Legend wrapperStyle={{ paddingTop: "10px", fontSize: window.innerWidth <= 640 ? 10 : 12 }} />
//                 <Line
//                   type="monotone"
//                   dataKey="value"
//                   stroke="#347DC1"
//                   strokeWidth={3}
//                   activeDot={{ r: 8, fill: "#347DC1", stroke: "#fff", strokeWidth: 2 }}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           )}
//         </div>
//       </div>

//       {/* Energy Saving Tips */}
//       <div className="tips-section">
//         <h2 className="flex items-center gap-2">
//           Energy Saving Tips
//           <span className="tooltip">
//             <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
//             <span className="tooltip-text">Follow these tips to reduce your energy consumption and save on bills.</span>
//           </span>
//         </h2>
//         <div className="tips-list">
//           {energySavingTips.map((tip, index) => (
//             <div key={index} className="tip-card">
//               <Zap className="tip-icon" />
//               <p>{tip}</p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Bar Chart for Energy Comparison */}
//       {devices.length > 0 && (
//         <div className="comparison-section">
//           <h2 className="flex items-center gap-2">
//             Energy Consumption Comparison - Per Device
//             <span className="tooltip">
//               <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
//               <span className="tooltip-text">Compare energy usage across devices for today, yesterday, and this month.</span>
//             </span>
//           </h2>
//           <div className="chart-container">
//             {loading ? (
//               <div className="loading">
//                 <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
//                 <span>Loading data...</span>
//               </div>
//             ) : (
//               <ResponsiveContainer width="100%" height={window.innerWidth <= 640 ? 250 : 300}>
//                 <BarChart
//                   data={devices.map(device => ({
//                     device: device.name,
//                     today: getTodayConsumption(device.consumptionData?.daily || {}),
//                     yesterday: getYesterdayConsumption(device.consumptionData?.daily || {}),
//                     thisMonth: getThisMonthConsumption(device.consumptionData?.monthly || {}),
//                   }))}
//                   margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
//                 >
//                   <BarCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
//                   <BarXAxis
//                     dataKey="device"
//                     stroke="#4b5563"
//                     tick={{ fontSize: window.innerWidth <= 640 ? 10 : 12 }}
//                     interval={0} // Show all device names
//                     angle={devices.length > 3 ? -45 : 0} // Rotate labels if there are many devices
//                     textAnchor={devices.length > 3 ? "end" : "middle"}
//                     height={devices.length > 3 ? 60 : 30} // Increase height to accommodate rotated labels
//                   />
//                   <BarYAxis
//                     domain={[0, maxY]}
//                     tickCount={5}
//                     tickFormatter={(value) => value.toFixed(1)}
//                     stroke="#4b5563"
//                     tick={{ fontSize: window.innerWidth <= 640 ? 10 : 12 }}
//                   />
//                   <BarTooltip
//                     contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
//                     formatter={(value) => `${value.toFixed(2)} kWh`}
//                   />
//                   <BarLegend wrapperStyle={{ paddingTop: "10px", fontSize: window.innerWidth <= 640 ? 10 : 12 }} />
//                   <Bar dataKey="today" fill="#347DC1" name="Today" radius={[4, 4, 0, 0]} />
//                   <Bar dataKey="yesterday" fill="#82ca9d" name="Yesterday" radius={[4, 4, 0, 0]} />
//                   <Bar dataKey="thisMonth" fill="#facc15" name="This Month" radius={[4, 4, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Insights */}
//       {devices.length > 0 && (
//         <div className="insights-section">
//           <h2 className="flex items-center gap-2">
//             Energy Insights
//             <span className="tooltip">
//               <Info className="w-5 h-5 text-gray-500 cursor-pointer" />
//               <span className="tooltip-text">Insights based on your energy consumption patterns.</span>
//             </span>
//           </h2>
//           <p>
//             {highestConsumptionDevice
//               ? `${highestConsumptionDevice.name} consumes the highest energy overall. Consider optimizing its usage by setting a timer or using an energy-efficient mode.`
//               : "No significant consumption data available yet. Use your devices to generate insights."}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Energy;