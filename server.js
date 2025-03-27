import dotenv from 'dotenv';  // Use import instead of require
import express from 'express';
import cors from 'cors';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import {db} from './src/pages/firestore.js'; // Import Firestore db instance
import {doc, getDoc, setDoc} from 'firebase/firestore'; // Import Firestore doc function

const app = express();
app.use(cors());
app.use(express.json());

// **Generate 2FA Secret & QR Code**
app.post("/generate-2fa", async (req, res) => {
    const { userId } = req.body;

    // Generate secret key
    const secret = speakeasy.generateSecret({ length: 20 });

    // Store secret in Firestore or a database (temporary here)
    const userRef = doc(db, "Users", userId);
    try {
        await setDoc(userRef, { secret: secret.base32 }, { merge: true });
        console.log('Secret saved for user:', userId);

        // Generate QR Code for Google Authenticator
        const otpauth_url = secret.otpauth_url;
        const qrCodeImage = await qrcode.toDataURL(otpauth_url);

        res.json({ secret: secret.base32, qrCode: qrCodeImage });
    } catch (error) {
        console.error("Error saving 2FA secret:", error);
        res.status(500).json({ success: false, message: "Failed to generate 2FA." });
    }
});

// **Verify 2FA OTP**
app.post("/verify-2fa", async (req, res) => {
    const { userId, token } = req.body;

    const userRef = doc(db, "Users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        console.log(`User not found: ${userId}`);
        return res.status(400).json({ success: false, message: "User not found." });
    }

    const secret = userDoc.data().secret;
    if (!secret) {
        console.log(`No secret found for user: ${userId}`);
        return res.status(400).json({ success: false, message: "No secret found." });
    }

    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
        window: 1, // Allows for slight time difference
    });

    if (verified) {
        console.log(`OTP verified for user: ${userId}`);
        res.json({ success: true });
    } else {
        console.log(`Invalid OTP for user: ${userId}`);
        res.status(400).json({ success: false, message: "Invalid OTP." });
    }
});


app.listen(5000, () => console.log("Server running on port 5000"));
