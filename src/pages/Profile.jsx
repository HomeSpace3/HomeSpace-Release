import { useState, useEffect } from 'react';
import profileIcon from '../assets/profile.png'; // placeholder
import { getAuth, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  // fetch user data on page load
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        // get user document from firestore
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        
        if (userDoc.exists()) {
          // show user's existing information from document
          setProfile({
            firstName: userDoc.data().firstName || '',
            lastName: userDoc.data().lastName || '',
            email: user.email || '',
            phone: userDoc.data().phone || '',
            dateOfBirth: userDoc.data().dateOfBirth || '',
          });
        } else {
          // default
          setProfile({
            firstName: '',
            lastName: '',
            email: user.email || '',
            phone: '',
            dateOfBirth: '',
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setErrors({ fetch: "Failed to load profile data." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, db]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
    // clear errors 
    if (errors[name]) {
      setErrors({...errors, [name]: null});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!profile.firstName) newErrors.firstName = 'First Name is required';
    if (!profile.lastName) newErrors.lastName = 'Last Name is required';
    if (!profile.email) newErrors.email = 'Email is required';
    if (!profile.phone) newErrors.phone = 'Phone Number is required';
    if (!profile.dateOfBirth) newErrors.dateOfBirth = 'Date of Birth is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!newPassword) newErrors.newPassword = 'New password is required';
    if (newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(prev => ({...prev, ...newErrors}));
    return Object.keys(newErrors).length === 0;
  };

  const handleReauthenticate = async () => {
    if (!currentPassword) {
      setErrors({...errors, currentPassword: 'Current password is required'});
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      setShowReauthModal(false);
      
      // update email if changed
      if (profile.email !== user.email) {
        await updateEmail(user, profile.email);
      }
      
      await saveProfileToFirestore();
      setCurrentPassword('');
    } catch (error) {
      console.error("Reauthentication failed:", error);
      setErrors({...errors, currentPassword: 'Incorrect password'});
    }
  };

  const saveProfileToFirestore = async () => {
    try {
      // update Firestore document with any changes 
      await setDoc(doc(db, "Users", user.uid), {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        updatedAt: new Date()
      }, { merge: true });
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({...errors, save: 'Failed to update profile. Please try again.'});
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      // ff email is changed, we need to reauthenticate first
      if (profile.email !== user.email) {
        setShowReauthModal(true);
        return;
      }
      
      await saveProfileToFirestore();
    } catch (error) {
      console.error("Error saving profile:", error);
      setErrors({...errors, save: 'Failed to update profile. Please try again.'});
    }
  };

  const handlePasswordSave = async () => {
    if (!validatePassword()) return;
    
    try {
      // update password in Firebase Auth
      await updatePassword(user, newPassword);
      
      setSuccessMessage('Password updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Error updating password:", error);
      
      if (error.code === 'auth/requires-recent-login') {
        setShowReauthModal(true);
      } else {
        setErrors({...errors, password: 'Failed to update password. Please try again.'});
      }
    }
  };

  // render form fields based on editing mode
  const renderField = (label, name, type = 'text', value) => (
    <div className="mb-4 flex flex-col">
      <label className="mb-1">{label}</label>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      ) : (
        <div className="p-2 bg-gray-100 rounded min-h-5">{value}</div>
      )}
      {errors[name] && <span className="text-red-500 text-sm">{errors[name]}</span>}
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading profile...</div>;
  }

  return (
    <div className="min-w-[250px] w-full flex flex-col p-3">
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {/* error message for general errors */}
      {(errors.fetch || errors.save) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.fetch || errors.save}
        </div>
      )}
      
      <h1 className="text-2xl font-semibold mb-2">Profile</h1>
      <div className="flex items-center mb-2">
        <div className="relative flex items-center">
          <img 
            src={profileIcon} 
            alt="Profile" 
            className="w-20 h-20 rounded-full mr-3 object-cover"
          />
        </div>
      </div>

      {/* reauthentication Modal */}
      {showReauthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Verify Your Identity</h2>
            <p className="mb-4">For security reasons, please enter your current password to continue.</p>
            
            <div className="mb-4 flex flex-col relative">
              <label className="mb-1">Current Password</label>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded pr-8"
              />
              <span 
                className="absolute top-2/3 right-2 transform -translate-y-1/2 cursor-pointer" 
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <i className={`fas ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
              {errors.currentPassword && <span className="text-red-500 text-sm">{errors.currentPassword}</span>}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                type="button" 
                className="px-3 py-1.5 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => {
                  setShowReauthModal(false);
                  setCurrentPassword('');
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="px-3 py-1.5 bg-[#347DC1] text-white rounded hover:bg-[#0056b3]"
                onClick={handleReauthenticate}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* profile settings form fields */}
      <form>
        {renderField('First Name', 'firstName', 'text', profile.firstName)}
        {renderField('Last Name', 'lastName', 'text', profile.lastName)}
        {renderField('Email', 'email', 'email', profile.email)}
        {renderField('Phone Number', 'phone', 'tel', profile.phone)}
        {renderField('Date of Birth', 'dateOfBirth', 'date', profile.dateOfBirth)}
        
        <div className="flex gap-2 mb-8">
          {!isEditing ? (
            <button 
              type="button" 
              className="px-3 py-1.5 bg-[#347DC1] text-white rounded hover:bg-[#0056b3] mt-2"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                type="button" 
                className="px-3 py-1.5 bg-[#347DC1] text-white rounded hover:bg-[#0056b3] mt-2"
                onClick={handleSave}
              >
                Save Profile
              </button>
              <button 
                type="button" 
                className="px-3 py-1.5 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 mt-2"
                onClick={() => {
                  setIsEditing(false);
                  // reset form to original values from database
                  if (user) {
                    const fetchUserData = async () => {
                      const userDoc = await getDoc(doc(db, "Users", user.uid));
                      if (userDoc.exists()) {
                        setProfile({
                          firstName: userDoc.data().firstName || '',
                          lastName: userDoc.data().lastName || '',
                          email: user.email || '',
                          phone: userDoc.data().phone || '',
                          dateOfBirth: userDoc.data().dateOfBirth || '',
                        });
                      }
                    };
                    fetchUserData();
                  }
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>

      {/* password section - always editable */}
      <form>
        <h2 className="text-xl font-semibold mb-2">Change Password</h2>
        
        <div className="mb-4 flex flex-col relative">
          <label className="mb-1">New Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="newPassword"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded pr-8"
          />
          <span 
            className="absolute top-2/3 right-2 transform -translate-y-1/2 cursor-pointer" 
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </span>
          {errors.newPassword && <span className="text-red-500 text-sm">{errors.newPassword}</span>}
        </div>
        
        <div className="mb-4 flex flex-col relative">
          <label className="mb-1">Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded pr-8"
          />
          <span 
            className="absolute top-2/3 right-2 transform -translate-y-1/2 cursor-pointer" 
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </span>
          {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword}</span>}
        </div>
        
        <button 
          type="button" 
          className="px-3 py-1.5 bg-[#347DC1] text-white rounded hover:bg-[#0056b3] mt-2"
          onClick={handlePasswordSave}
        >
          Change Password
        </button>
        {errors.password && <div className="text-red-500 text-sm mt-2">{errors.password}</div>}
      </form>
    </div>
  );
};

export default Profile;