import { useState } from 'react';
import '../Styles/Login-Signup.css'
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from 'firebase/firestore';
import arrow from '../assets/arrow.png';
import { Eye, EyeOff } from 'lucide-react';
import axios from "axios";

export default function Login({ onSignup, handleVerify, onClose }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [otp, setOtp] = useState("");
    const [errors, setErrors] = useState({});
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false); // State for Forgot Password form
    const [showPassword, setShowPassword] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};

        setErrors({});


        try {
            // If not in forgot password mode, handle regular login
            if (!forgotPasswordMode) {
                // Firebase Authentication
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                console.log('Login successful');
                const userDoc = await getDoc(doc(db, 'Users', auth.currentUser.uid));
                const is2FAEnabled = userDoc.data()?.twoFactorEnabled;
                const is2FAVerified = userDoc.data()?.twoFactorVerified;
                const homeId = userDoc.data()?.homeId;

                if (is2FAEnabled && !is2FAVerified) {
                    onClose();
                    handleVerify();
                } else
                if (homeId) {
                    navigate('/home'); // Has home → Dashboard
                } else {
                    navigate('/home-setup'); // No home → Home Setup
                }
            } else {
                // Send password reset email
                await sendPasswordResetEmail(auth, formData.email);
                console.log('Password reset email sent');
                alert('Password reset email has been sent to your email address.');
                setForgotPasswordMode(false); // Switch back to the login form
            }

        } catch (error) {

            if (forgotPasswordMode) {
                if (!formData.email) {
                    newErrors.emailReset = 'This field is required';
                } else {
                    newErrors.emailReset = 'Invalid email address. Please try again.';
                }

            }
            else {
                if (!formData.email) {
                    newErrors.email = 'This field is required';
                } else if (error.code) {
                    newErrors.email = 'Invalid email or password';
                }

                if (!formData.password) {
                    newErrors.password = 'This field is required';
                } else if (error.code) {
                    newErrors.password = 'Invalid email or password';
                }
            }
            setErrors(newErrors);
        }
    };



    return (
        <section>
            {forgotPasswordMode ? (
                <div>
                    <div className="something">
                        <img src={arrow} alt="back icon" className="modal-back-button" onClick={() => setForgotPasswordMode(false)} />
                        <h3 className="step2">Reset Password.</h3>
                    </div>
                    <p class="forgot-pass-text">If you enter a registered email, we will send a reset password link to your email address.</p>
                    <label>Email</label>
                    <div className="input-container">
                        <input
                            type="email"
                            name="email"
                            placeholder="bencarter@gmail.com"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.emailReset ? 'input-error' : 'input-blue'}
                            required
                        />
                        {errors.emailReset && <p className="error-message">{errors.emailReset}</p>}
                    </div>
                    <button className="submit" type="submit" onClick={handleSubmit}>Send Reset Link</button>
                    <div className="signup-link">
                        <span>New? <a href="#signup" onClick={onSignup}>Sign up</a> - and build your smart home!</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="text-space">
                        <h3 className="first">Reconnect with your smart home — <span className="second">Log in now.</span></h3>
                    </div>
                    <form onSubmit={handleSubmit} noValidate>

                        <div>
                            <label>Email</label>
                            <div className="input-container">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="bencarter@gmail.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'input-error' : 'input-blue'}
                                    required
                                />
                                {errors.email && <p className="error-message">{errors.email}</p>}

                            </div>
                            <label>Password</label>
                            <div className="input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'input-error' : 'input-blue'}
                                    required
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
                            <div className="remember-forgot">
                                <label className="form-group checkbox-container">
                                    <input type="checkbox" id="remember" name="remember" />
                                    Stay logged in
                                </label>
                                <a className="forgot-password" href="##" onClick={() => setForgotPasswordMode(true)}>Forgot Password?</a>
                            </div>
                            <button className="submit" type="submit">Log in</button>

                            <div className="signup-link">
                                <span>New? <a href="#signup" onClick={onSignup}>Sign up</a> - and build your smart home!</span>
                            </div>
                        </div>

                    </form>
                </>
            )}

        </section>
    )
}