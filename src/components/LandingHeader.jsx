import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext';
import { auth } from '../pages/firebase';
import { db } from '../pages/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import homespaceIcon from '../assets/homespaceLogo.svg';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Verify from '../pages/Verify'; // Import the Verify component

function Modal({ type, onClose, onLogin, onSignup, handleVerify}) {
  return (
    <div className="modal modal-card">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>X</button>
        {type === 'login' && <Login onSignup={onSignup}  handleVerify={handleVerify}  onClose={onClose}/>}
        {type === 'signup' && <Signup onLogin={onLogin} onClose={onClose} />}
        {type === 'verify' && <Verify onClose={onClose} />} {/* Handle verify type */}
      </div>
    </div>
  );
}

const LandingHeader = () => {
  const { user, userData } = useAuth();
  const [modalType, setModalType] = useState(null);
  const navigate = useNavigate();

  //prevents scrolling when modal open
  useEffect(() => {
    if (modalType) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [modalType]);

  async function handleLogin() {
    if (user) {
      if (userData?.twoFactorEnabled && !userData?.twoFactorVerified) {
        handleVerify();
    } else {
      if (userData?.homeId) {
        navigate('/home'); // Go to Dashboard
      } else {
        navigate('/home-setup'); // Go to Home Setup
      } 
    }
    } else {
      setModalType('login'); // Show modal if not logged in
    }
    
  }

  function handleSignup() {
    setModalType('signup');
  }

  function handleVerify() {
    setModalType('verify'); // Set modal type to verify
  }

  function closeModal() {
    setModalType(null);
  }

  return (
    <section>
      {/* Dim overlay applied when modal is open */}
      {modalType && <div className="dim-overlay"></div>}
      <header className={`header ${modalType ? 'dimmed' : ''}`}>
        <div className="header-container">
          <div className="landing-header">

            {/* Center - Logo */}
            <div className="landing-logo" onClick={() => navigate('/')}>
              <img
                src={homespaceIcon}
                alt="HomeSpace Logo"
                className="landing-logo-icon"
              />
            </div>

            <nav className="landing-nav">
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#learn">Learn</a></li>
                <li><a href="#team">Team</a></li>

              </ul>
            </nav>
            <div className="button-container">
              <button className="login" onClick={handleLogin}>Log in</button>
              {user && (
                <button className="login" onClick={async () => {
                  try {
                    const confirmLeave = window.confirm('Are you sure you want to log out?');
                    if (!confirmLeave) return;
                    const userRef = doc(db, "Users", user.uid);
                    await updateDoc(userRef, { twoFactorVerified: false });
                    await signOut(auth);
                    console.log('Logout successful');
                    navigate('/');
                  } catch (error) {
                    console.error('Logout failed', error);
                  }
                }}>Logout</button>
              )}
              {!user && (
                <button className="signup" onClick={handleSignup}>Sign up</button>
              )}
            </div>
          </div>
        </div>
      </header>

      {modalType && <Modal type={modalType} onClose={closeModal} onLogin={handleLogin} onSignup={handleSignup} handleVerify={handleVerify} />}
    </section>

  );
};

export default LandingHeader;