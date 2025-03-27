import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/DeviceGrid.css";
import { Html5QrcodeScanner } from "html5-qrcode";
import { getFirestore, doc, setDoc, collection, arrayUnion, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useParams } from "react-router-dom";
import { calculateEnergyConsumption } from "../functions/shared/device";

const db = getFirestore();

const capitalizeWords = (str) => {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const AddDeviceCard = ({ onAddDevice }) => {
  const navigate = useNavigate();
  const { homeId } = useParams();
  const [scanResult, setScanResult] = useState(null);
  const [deviceTemperature] = useState(24); // default temperature for AC
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner = null;

    if (isScanning) {
      scanner = new Html5QrcodeScanner("reader", {
        qrbox: { width: 250, height: 250 },
        fps: 15,
      });

      const onScanSuccess = (decodedText) => {
        console.log("Decoded text:", decodedText);

        try {
          const scannedDevice = JSON.parse(decodedText);
          const userId = getAuth().currentUser?.uid;

          // Validate the required fields
          if (!scannedDevice.name || !scannedDevice.type || typeof scannedDevice.status !== 'boolean' || !scannedDevice.manufacturer || !scannedDevice.model || typeof scannedDevice.powerRating_kW !== 'number' || scannedDevice.powerRating_kW <= 0) {
            throw new Error("Invalid QR code data. Missing required fields or invalid values.");
          }

          // device data
          const deviceData = {
            name: scannedDevice.name,
            type: capitalizeWords(scannedDevice.type),
            status: scannedDevice.status,
            manufacturer: scannedDevice.manufacturer,
            model: scannedDevice.model,
            powerRating_kW: scannedDevice.powerRating_kW,
          };

          // add temperature field if the device is an AC
          if (deviceData.type === "Ac") {
            deviceData.temperature = deviceTemperature;
          }

          if (userId && homeId) {
            const newDeviceRef = doc(collection(db, `Homes/${homeId}/devices`));
            setDoc(newDeviceRef, deviceData)
              .then(async () => {
                console.log("Device added successfully!");
                console.log("device id: ", newDeviceRef.id);
                alert("Device added successfully");
                const energyConsumptionRef = collection(db, `Homes/${homeId}/devices/${newDeviceRef.id}/energyConsumption`);
                await setDoc(doc(energyConsumptionRef, "daily"), {});
                await setDoc(doc(energyConsumptionRef, "monthly"), {});
                await setDoc(doc(energyConsumptionRef, "yearly"), {});

                const dailyDocRef = doc(db, `Homes/${homeId}/devices/${newDeviceRef.id}/energyConsumption/daily`);

                const dailyDocSnap = await getDoc(dailyDocRef);
                const dailyData = dailyDocSnap.exists() ? dailyDocSnap.data() : {};
                const localtime = new Date().toLocaleString("en-CA", { timeZone: "Asia/Dubai", hour12: false }).replace(",", "");
                const localtoday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }).split(",")[0];

                if (deviceData.status) {
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
                  const deviceDocSnap = await getDoc(newDeviceRef);
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
                    await calculateEnergyConsumption(startTime, localtime, powerRating_kW, dailyDocRef, monthlyDocRef, yearlyDocRef, dailyData, deviceData.homeId);
                  } else {
                    console.error("No valid start timestamp found.");
                  }
                  onAddDevice(scannedDevice);
                }
              })
    .catch((error) => {
      console.error("Error adding device:", error);
  });

} else {
  console.error("No authenticated user or homeId found");
}

setScanResult(decodedText);
scanner.clear();
setIsScanning(false);

        } catch (error) {
  console.error("Error adding device:", error);
}
      };

const onScanFailure = (error) => {
  console.warn("QR Code scan error:", error);
};

scanner.render(onScanSuccess, onScanFailure);
    }

return () => {
  if (scanner) {
    scanner.clear(); // clean up the scanner when the component unmounts
  }
};
  }, [isScanning, homeId, navigate, onAddDevice]);

const startScanner = () => {
  if (!homeId) {
    console.error("Home ID is missing in the URL");
    return;
  }
  setIsScanning(true);
};

const RadarLoader = () => {
  return (
    <div className="loader">
      <span></span>
    </div>
  );
};

return (
  <div className="add-container">
    <div className="add-header">
      <button
        onClick={() => navigate('/home')}
        className="absolute left-[20px] px-4 py-2 bg-[#347DC1] hover:bg-[#0056b3] text-white font-semibold rounded-[40px] gap-[5px] shadow-md transition"
      >
        Back
      </button>
      <h1 className="add-title">Add Device</h1>
      <button className="scan-button" onClick={startScanner}>
        <svg
          width="21"
          height="19"
          viewBox="0 0 21 19"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20.3099 5.35852C20.691 5.35852 21 5.06672 21 4.70677V3.12175e-05H19.6198V4.70677C19.6198 5.06672 19.9287 5.35852 20.3099 5.35852Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.4229 0.581156C14.4229 0.902075 14.7318 1.16223 15.113 1.16223L20.3099 1.16223V8.10623e-05L15.113 8.10623e-05C14.7318 8.10623e-05 14.4229 0.260237 14.4229 0.581156Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.93262 0.623465C5.93262 0.279202 5.60956 0.00012207 5.21105 0.00012207L4.79385e-05 0.00012207V1.24681L5.21105 1.24681C5.60956 1.24681 5.93262 0.967728 5.93262 0.623465Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.643293 5.94092C0.998593 5.94092 1.28662 5.66184 1.28662 5.31758L1.28662 0.623516H-3.5882e-05L-3.5882e-05 5.31758C-3.5882e-05 5.66184 0.287992 5.94092 0.643293 5.94092Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.93262 18.3767C5.93262 18.7209 5.60956 19 5.21105 19H4.79385e-05V17.7533H5.21105C5.60956 17.7533 5.93262 18.0324 5.93262 18.3767Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.643293 13.0592C0.998593 13.0592 1.28662 13.3383 1.28662 13.6825L1.28662 18.3766H-3.5882e-05L-3.5882e-05 13.6825C-3.5882e-05 13.3383 0.287992 13.0592 0.643293 13.0592Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.0674 18.3767C15.0674 18.7209 15.3904 19 15.789 19H21V17.7533H15.789C15.3904 17.7533 15.0674 18.0324 15.0674 18.3767Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20.3567 13.0592C20.0014 13.0592 19.7134 13.3383 19.7134 13.6825V18.3766H21V13.6825C21 13.3383 20.712 13.0592 20.3567 13.0592Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.37256 9.50004C3.37256 9.11884 3.71469 8.80981 4.13673 8.80981H16.8633C17.2854 8.80981 17.6275 9.11884 17.6275 9.50004C17.6275 9.88125 17.2854 10.1903 16.8633 10.1903H4.13673C3.71469 10.1903 3.37256 9.88125 3.37256 9.50004Z"
          />
        </svg>
        Scan QR
      </button>
    </div>

    <div className="scan-card">
      <div className="scanner-container">
        {!isScanning && (
          <div className="searching-text">
            <RadarLoader />
            <p className="title">
              Searching for nearby devices. Make sure your device has entered
              <span className="pairing-mode"> pairing mode</span>.
            </p>
          </div>
        )}
        {scanResult && (
          <div className="flex flex-col items-center justify-center p-4 bg-green-100 border border-green-400 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-green-700">Device added successfully</h3>
            <pre className="text-sm text-gray-600 bg-white p-2 rounded-md mt-2">{scanResult}</pre>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition"
            >
              Return to Home
            </button>
          </div>
        )}
        <div
          id="reader"
          className={isScanning ? "reader-visible" : "reader-hidden"}
        >
        </div>
      </div>
    </div>
  </div>
);
};

export default AddDeviceCard;