import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Login-Signup.css'
import arrow from '../assets/arrow.png';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage({ onLogin, onClose }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState(false);
    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    //  sign up user, add account to authentication table and create firestore document 
    async function signUpUser(email, password, firstName, lastName, dateOfBirth, phone) {
        try {
            // 1. Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create user document in Firestore
            await setDoc(doc(db, "Users", user.uid), {
                userId: user.uid,
                email: email,
                phone: phone,
                firstName: firstName,
                lastName: lastName,
                dateOfBirth: dateOfBirth,
                isAdmin: false, // default role
                homeId: null, // default no home
                twoFactorEnabled: false, // default 2FA off
                twoFactorVerified: false, // default 2FA not verified
                hasSeenDashboardGuide: false, // default no dashboard guide
                badges: [], // no badges initially
                notifications: [], // no notifications initially
                goals: [], // no goals initially
                createdAt: new Date(),
            });

            console.log("User signed up and added to Firestore successfully!");
            navigate('/home-setup'); // No home → Home Setup
        } catch (error) {
            console.error("Error signing up:", error.message);
            throw error; // Rethrow to handle in UI
        }
    }

    function handleNextStep(e) {
        e.preventDefault();

        const newErrors = {};

        if (!formData.firstName) {
            newErrors.firstName = 'This field is required';
        } else if (!/^[a-zA-Z]+$/.test(formData.firstName)) {
            newErrors.firstName = 'First name is invalid';
        }

        if (!formData.lastName) {
            newErrors.lastName = 'This field is required';
        } else if (!/^[a-zA-Z]+$/.test(formData.lastName)) {
            newErrors.lastName = 'Last name is invalid';
        }

        if (!formData.email) {
            newErrors.email = 'This field is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email address is invalid';
        }

        if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'This field is required';
        } else if (!/^\+?[0-9]\d{9,14}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number is invalid';
        }

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = 'This field is required';
        } else {
            const today = new Date();
            const dob = new Date(formData.dateOfBirth);
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            // Check minimum age (13 years)
            if (age < 13) {
                newErrors.dateOfBirth = 'User must be at least 13 years old';
            }

            // Check maximum age (120 years)
            if (age > 120 || dob > today) {
                newErrors.dateOfBirth = 'Date of birth is invalid';
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setStep(2); // proceed to create password
        }
    }

    function handlePreviousStep() {
        setStep(1); // first menu (email, phone etc.)
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const newErrors = {};

        if (!formData.password) {
            newErrors.password = "This field is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters long";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "This field is required";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            try {
                const { email, password, firstName, lastName, dateOfBirth, phoneNumber } = formData;

                // Call signUpUser function
                await signUpUser(email, password, firstName, lastName, dateOfBirth, phoneNumber);

                console.log("User registered successfully!");
            } catch (error) {
                if (error.code === "auth/email-already-in-use") {
                    setErrors({ email: "Email is already registered" });
                    setStep(1);
                } else {
                    setErrors({ firebase: error.message });
                }
            }
        }
    }

    return (
        <section>
            {step === 1 ? (
                <>
                    <div className="text-space">
                        <h3 className="first">Smarten up your space —<span className="second">Step in.</span></h3>
                    </div>
                    <form onSubmit={handleNextStep} noValidate>
                        <div className="details">
                            <div className="input-group">
                                <label>First Name</label>
                                <div className="input-container">
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="Ben"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={errors.firstName ? 'input-error' : 'input-blue'}
                                    />
                                    {errors.firstName && <p className="error-message">{errors.firstName}</p>}
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Last Name</label>
                                <div className="input-container">
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Carter"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={errors.lastName ? 'input-error' : 'input-blue'}
                                    />
                                    {errors.lastName && <p className="error-message">{errors.lastName}</p>}
                                </div>
                            </div>
                        </div>
                        <label>Email</label>
                        <div className="input-container">
                            <input
                                type="email"
                                name="email"
                                placeholder="bencarter@gmail.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'input-error' : 'input-blue'}
                            />
                            {errors.email && <p className="error-message">{errors.email}</p>}
                        </div>
                        <div className="input-group">
                            <label>Phone Number</label>
                            <div className="input-container">
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    placeholder="+971551234567"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className={errors.phoneNumber ? 'input-error' : 'input-blue'}
                                />
                                {errors.phoneNumber && <p className="error-message">{errors.phoneNumber}</p>}
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Date of Birth</label>
                            <div className="input-container">
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className={errors.dateOfBirth ? 'input-error' : 'input-blue'}
                                />
                                {errors.dateOfBirth && <p className="error-message">{errors.dateOfBirth}</p>}
                            </div>
                        </div>
                        <button className="submit" type="submit">Continue</button>
                        <div className="signup-link">
                            <span>Already have an account? <a href="#login" onClick={onLogin}>Log in</a></span>
                        </div>

                    </form>
                </>
            ) : (
                <>
                    <div className="something">
                        <img src={arrow} alt="back icon" className="modal-back-button" onClick={handlePreviousStep} />
                        <h3 className="step2">Set Your Password.</h3>
                    </div>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="input-container">
                            <label>Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'input-error' : 'input-blue'}
                            />
                            <button
                                type="button"
                                className={showPassword ? "blue-password-toggle" : "password-toggle"}
                                onClick={() => setShowPassword(prev => !prev)}
                            >
                                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                            {errors.password && <p className="error-message">{errors.password}</p>}
                        </div>
                        <div className="input-container">
                            <label>Confirm Password</label>
                            <input
                                type={confirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'input-error' : 'input-blue'}
                            />
                            <button
                                type="button"
                                className={confirmPassword ? "blue-password-toggle" : "password-toggle"}
                                onClick={() => setConfirmPassword(prev => !prev)}
                            >
                                {confirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                        </div>
                        <small>By registering, you agree to HomeSpace&apos;s <a>Terms of Service</a> and <a>Privacy Policy</a>.</small>
                        <button className="submit" type="submit">Sign up</button>

                        <div className="signup-link">
                            <span>Already have an account? <a href="#signup" onClick={onLogin}>Log in</a></span>
                        </div>
                    </form>
                </>
            )}
        </section>
    );
}