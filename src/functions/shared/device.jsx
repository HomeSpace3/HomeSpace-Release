import { db } from "../../pages/firestore"; 
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
// import { calculateEnergyConsumption } from "./energyConsumption";

export const toggleDeviceStatus = async (homeId, deviceId, currentStatus, setDevices) => {
  console.log("Toggling device status", { deviceId, currentStatus });
  const newStatus = !currentStatus;
  const deviceRef = doc(db, `Homes/${homeId}/devices/${deviceId}`);
  const localtime = new Date().toLocaleString("en-CA", { timeZone: "Asia/Dubai", hour12: false }).replace(",", "");
  const dailyDocRef = doc(db, `Homes/${homeId}/devices/${deviceId}/energyConsumption/daily`);
  const monthlyDocRef = doc(db, `Homes/${homeId}/devices/${deviceId}/energyConsumption/monthly`);
  const yearlyDocRef = doc(db, `Homes/${homeId}/devices/${deviceId}/energyConsumption/yearly`);

  try {
    // Update device status in Firestore
    await updateDoc(deviceRef, { status: newStatus });
    console.log("Device status updated in Firestore", { deviceId, newStatus });

    // Update local state
    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.id === deviceId ? { ...device, status: newStatus } : device
      )
    );

    const dailyDocSnap = await getDoc(dailyDocRef);
    const dailyData = dailyDocSnap.exists() ? dailyDocSnap.data() : {};

    const localtoday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }).split(",")[0];

    if (newStatus) {
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
  } catch (error) {
    console.error("Error updating device status:", error);
  }
}

const parseDate = (dateStr) => {
    return new Date(dateStr.replace(/(\d{4}-\d{2}-\d{2}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(a\.m\.|p\.m\.)/i,
      (match, date, hour, minute, second, meridian) => {
        let h = parseInt(hour);
        if (meridian.toLowerCase() === "p.m." && h !== 12) h += 12;
        if (meridian.toLowerCase() === "a.m." && h === 12) h = 0;
        return `${date}T${h.toString().padStart(2, "0")}:${minute}:${second}`;
      }
    ));
  };

export const calculateEnergyConsumption = async (startTime, endTime, powerRating_kW, dailyDocRef, monthlyDocRef, yearlyDocRef, dailyData, homeId) => {
    let startDate = parseDate(startTime);
    let endDate = parseDate(endTime);
    let totalConsumption = 0;
  
    while (startDate < endDate) {
      const sessionDate = startDate.toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }).replace(",", "");
      const midnight = new Date(startDate);
      midnight.setHours(23, 59, 59, 999);
  
      const periodEnd = midnight < endDate ? midnight : endDate;
      const durationHours = (periodEnd - startDate) / (1000 * 60 * 60); // Duration in hours
      const energyConsumption_kWh = durationHours * powerRating_kW;
      totalConsumption += energyConsumption_kWh;
  
      // Update Firestore: Append session and update total consumption for the day
      await updateDoc(dailyDocRef, {
        [`${sessionDate}.sessions`]: arrayUnion({ start: startTime, end: periodEnd.toLocaleString("en-CA", { timeZone: "Asia/Dubai", hour12: false }).replace(",", ""), energy: energyConsumption_kWh }),
        [`${sessionDate}.total`]: parseFloat(((dailyData[sessionDate]?.total || 0) + energyConsumption_kWh).toFixed(4))
      });

      // Update Firestore: Append session and update total consumption for the month
      const month = startDate.toISOString().split("T")[0].slice(0, 7);
      const year = startDate.getFullYear();
      const monthlyDocSnap = await getDoc(monthlyDocRef);
      const monthlyData = monthlyDocSnap.exists() ? monthlyDocSnap.data() : {};
      await updateDoc(monthlyDocRef, {
        [`${month}.total`]: parseFloat(((monthlyData[`${month}`]?.total || 0) + energyConsumption_kWh).toFixed(4))
      });

      // Update Firestore: Append session and update total consumption for the year
      const yearlyDocSnap = await getDoc(yearlyDocRef);
      const yearlyData = yearlyDocSnap.exists() ? yearlyDocSnap.data() : {};
      await updateDoc(yearlyDocRef, {
        [`${year}.total`]: parseFloat(((yearlyData[`${year}`]?.total || 0) + energyConsumption_kWh).toFixed(4))
      });

      // Update overall energy records for the home
      const overallDailyDocRef = doc(db, `Homes/${homeId}/energyRecords/daily`);
      const overallMonthlyDocRef = doc(db, `Homes/${homeId}/energyRecords/monthly`);
      const overallYearlyDocRef = doc(db, `Homes/${homeId}/energyRecords/yearly`);

      const overallDailyDocSnap = await getDoc(overallDailyDocRef);
      const overallDailyData = overallDailyDocSnap.exists() ? overallDailyDocSnap.data() : {};
      await updateDoc(overallDailyDocRef, {
        [`${sessionDate}.total`]: parseFloat(((overallDailyData[`${sessionDate}`]?.total || 0) + energyConsumption_kWh).toFixed(4))
      });

      const overallMonthlyDocSnap = await getDoc(overallMonthlyDocRef);
      const overallMonthlyData = overallMonthlyDocSnap.exists() ? overallMonthlyDocSnap.data() : {};
      await updateDoc(overallMonthlyDocRef, {
        [`${month}.total`]: parseFloat(((overallMonthlyData[`${month}`]?.total || 0) + energyConsumption_kWh).toFixed(4))
      });

      const overallYearlyDocSnap = await getDoc(overallYearlyDocRef);
      const overallYearlyData = overallYearlyDocSnap.exists() ? overallYearlyDocSnap.data() : {};
      await updateDoc(overallYearlyDocRef, {
        [`${year}.total`]: parseFloat(((overallYearlyData[`${year}`]?.total || 0) + energyConsumption_kWh).toFixed(4))
      });

      // Move to the next day at 00:00:00
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
    }
  
    console.log(`Energy logged across days. Total: ${totalConsumption.toFixed(4)} kWh`);
  
    // Delete incomplete session (session without end timestamp) after energy logging
    const lastSessionDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }).replace(",", "");
    const incompleteSession = dailyData[lastSessionDate]?.sessions?.find(session => !session.end);
  
    if (incompleteSession) {
      await updateDoc(dailyDocRef, {
        [`${lastSessionDate}.sessions`]: arrayRemove(incompleteSession)
      });
      console.log("Deleted incomplete session", incompleteSession);
    }
      // Move to the next day at 00:00:00
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
  };