import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../pages/AuthContext'; // Import useAuth hook
import homespaceIcon from '../assets/homespaceLogo.svg';
import menuIcon from '../assets/menu.svg';
import profileIcon from '../assets/profile.png';
import logoutIcon from '../assets/logout.svg';
import settingsIcon from '../assets/settings.svg';
import rewardsIcon from '../assets/rewards.svg';
import { signOut } from 'firebase/auth';
import { auth, db } from '../pages/firebase';
import { doc, getDoc, updateDoc, arrayRemove, deleteDoc, deleteField, onSnapshot} from 'firebase/firestore';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { userData, setUserData } = useAuth(); // Get Firestore user data
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const profileRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      const userDocRef = doc(db, 'Users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const updatedUserData = userDocSnap.data();
        setUserData(updatedUserData);  // This will update the context
      }
    };

    fetchUserData(); // Initial fetch

    const userDocRef = doc(db, 'Users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists) {
        const updatedUserData = doc.data();
        setUserData(updatedUserData);  // Update context on document change
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [currentUser.uid, setUserData]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLeaveHome = async () => {
    if (!userData?.homeId) return;

    // get users current home and user document
    const homeRef = doc(db, 'Homes', userData.homeId);
    const homeSnap = await getDoc(homeRef);

    const userRef = doc(db, "Users", currentUser.uid);

    if (!homeSnap.exists()) {
      alert('Home not found.');
      return;
    }

    const homeData = homeSnap.data();
    const members = homeData.members;
    const isOwner = homeData.ownerId === userData.userId;

    if (isOwner && members.length > 1) {
      alert('You must transfer home ownership before leaving.');
      return;
    }

    const confirmLeave = window.confirm(
      isOwner && members.length === 1
        ? 'You are the only member of this home. Leaving will delete the home and all its data. Proceed?'
        : 'Are you sure you want to leave this home?'
    );

    if (!confirmLeave) return;

    try {
      // if last remaining member to leave is owner, prompt and delete home
      if (isOwner && members.length === 1) {
        await deleteDoc(homeRef);
      } else {
        // otherwise just remove the user from the home document and clear homeId field in user document
        await updateDoc(homeRef, {
          members: arrayRemove(userData.userId),
          [`membersPermissions.${userData.userId}`]: deleteField(),
        });
      }

      //sets homeId to null
      await updateDoc(userRef, {
        homeId: null,
        isAdmin: false,
      });

      alert('You have successfully left the home.');
      navigate('/home-setup');
    } catch (error) {
      console.error('Error leaving home:', error);
      alert('Failed to leave home. Please try again.');
    }
  };

  const profileItems = [
    { id: 'settings', label: 'Settings', icon: settingsIcon, onClick: () => navigate('/settings') },
    { id: 'rewards', label: 'Rewards', icon: rewardsIcon, onClick: () => navigate('/rewards') },
    {
      id: 'logout',
      label: 'Logout',
      icon: logoutIcon,
      onClick: async () => {
        try {
          const userRef = doc(db, "Users", currentUser.uid);
          await updateDoc(userRef, { twoFactorVerified: false });
          await signOut(auth);
          console.log('Logout successful');
          navigate('/');
        } catch (error) {
          console.error('Logout failed', error);
        }
      }
    }
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-grid">
          {/* Home Management Menu */}
          <div className="menu" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="menu-button">
              <img src={menuIcon} alt="menu icon" className="menu-icon" />
              <span className='menu-text'>Home Management</span>
            </button>
            {isMenuOpen && (
              <div className="menu-dropdown">
                <button onClick={() => navigate('/manage-users')} className="menu-item">{userData?.isAdmin ? "Manage Users" : "View Users"} </button>
                <button onClick={() => navigate('/home-settings')} className="menu-item">{userData?.isAdmin ? "Edit Home Settings" : "View Home Settings"} </button>
                <button onClick={handleLeaveHome} className="menu-item menu-item-leave">Leave Home</button>
              </div>
            )}
          </div>

          <div className="logo" onClick={() => navigate('/home')}>
            <img src={homespaceIcon} alt="HomeSpace Logo" className="logo-icon" />
            <h1>HomeSpace</h1>
          </div>

          {/* User Profile Info */}
          <div className="profile" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="profile-button">
              <div className="profile-icon-container">
                <img src={profileIcon} alt="profile" className="profile-icon" />
              </div>
              <div className='profile-text'>
                <h1>{userData?.firstName} {userData?.lastName}</h1>
                <h2>{userData?.isAdmin ? 'Admin' : 'User'}</h2>
              </div>
            </button>

            {/* Profile Menu */}
            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-items">
                  {profileItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.onClick();
                        setIsProfileOpen(false);
                      }}
                      className={`profile-item ${item.id === 'logout' ? 'profile-item-logout' : ''}`}
                    >
                      <img src={item.icon} alt={item.label} className="profile-item-icon" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
