import { useState, useRef, useEffect } from "react";
import axios from "axios"; // Import axios
import { auth } from "./firebase"; // Ensure auth is correctly imported
import "../Styles/Login-Signup.css";
import { useNavigate } from "react-router-dom";
import { updateDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";

export default function SettingsVerify() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const inputRefs = useRef([]);

    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;


    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Allow only numbers

        let newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if a digit is entered
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(pasteData)) {
            setOtp(pasteData.split(""));
            inputRefs.current[5].focus(); // Move to last field
        }
    };

    const verifyOtp = async () => {

        if (!auth.currentUser?.uid) {
            setError("User is not logged in.");
            return;
        }

        try {
            const response = await axios.post("http://10.6.139.101:5000/verify-2fa", {
                userId: auth.currentUser.uid,  // Ensure user is logged in
                token: otp.join(""),           // Convert array to string
            });

             // Log the response data here
        console.log("Response Data:", response.data);  // This will log the response from your backend


            if (response.data.success) {
                await updateDoc(doc(db, "Users", auth.currentUser.uid), { twoFactorEnabled: true, twoFactorVerified: true });
                window.alert("Two-Factor Authentication enabled successfully.");
                window.location.reload();
            } else {
                setError("Invalid OTP. Try again.");
            }
        } catch (err) {
            console.error("OTP verification error:", err.response || err);
            setError("Invalid OTP. Try again.");
        }
    };



    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const enteredCode = otp.join("");

        if (enteredCode.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }

        verifyOtp();
    };

    return (
        <section>
            <p>
                Enter the 6-digit code from the Google Authenticator app.
            </p>

            <form onSubmit={handleSubmit} noValidate>
                <div className="otp-container">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste} // Handle pasting full OTP
                            className="otp-box"
                        />
                    ))}
                </div>
                {error && <small className="authentication-error-message">{error}</small>}

                <button className="submit" type="submit">
                    Verify
                </button>
            </form>
        </section>
    );
}
