import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import profileIcon from '../assets/profile.png';
import Profile from './Profile';
import PrivacySettings from './PrivacySettings';
import MyGoals from './MyGoals'

const Settings = () => {
    const { user } = useAuth();
    const [activeMenu, setActiveMenu] = useState('Profile');
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
    });

    useEffect(() => {
        if (user) {
            console.log("User ID:", user.uid);
            const userRef = doc(db, 'Users', user.uid);
            getDoc(userRef).then((docSnap) => {
                if (docSnap.exists()) {
                    console.log("Firestore Data:", docSnap.data());
                    setProfile(docSnap.data());
                } else {
                    console.log("No such document!");
                }
            }).catch(error => console.error("Error fetching document:", error));
        }
    }, [user]);

    const renderContent = () => {
        switch (activeMenu) {
            case 'Profile':
                return <Profile />;
            case 'Privacy Settings':
                return <div className="p-4"> <PrivacySettings /></div>;
            case 'My Goals':
                return <div className="p-4 "><MyGoals/></div>;
            case 'FAQ & Feedback':
                return (
                    <div className="p-4 bg-white">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Installation & Setup Guide</h2>
                        <section>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Installation & Setup Guide</h2>
                                <div className="space-y-4 text-gray-700">
                                    <div>
                                        <h3 className="font-semibold">1. Visit the App:</h3>
                                        <ul className="list-disc list-inside pl-4">
                                            <li>Go to the HomeSpace web App URL</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">2. Create an Account:</h3>
                                        <ul className="list-disc list-inside pl-4">
                                            <li>Click Sign Up on the landing page</li>
                                            <li>Enter your details: Name, Email, Phone number, Password</li>
                                            <li>Set up Two-Factor Authentication</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">3. Create or Join a Home:</h3>
                                        <ul className="list-disc list-inside pl-4">
                                            <li>After finishing Signing Up you will be asked to create a new Home or join an existing home using its ID</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">4. Start using HomeSpace:</h3>
                                        <ul className="list-disc list-inside pl-4">
                                            <li>Add devices and setup scenes to track energy usage and manage your smart home from anywhere</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
                                <div className="space-y-4 text-gray-700">
                                    <div>
                                        <h3 className="font-semibold">Q1: How do I reset my password?</h3>
                                        <p className="pl-4">Use the "Forgot Password?" link on the login page to receive a reset link via email.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Q2: Can I add multiple users to a home?</h3>
                                        <p className="pl-4">Yes, once the home is created, share the Home ID so other users can join.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Q3: Why isn't my Scenes working/Triggering?</h3>
                                        <p className="pl-4">If a scene isn't working, common reasons would be:</p>
                                        <ul className="list-disc list-inside pl-8">
                                            <li>Incorrect scheduling</li>
                                            <li>Devices not properly added</li>
                                            <li>Permissions not granted</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Q5: Does this work on Mobile?</h3>
                                        <p className="pl-4">Yes, HomeSpace is fully responsive and works on both desktop and mobile browsers.</p>
                                    </div>
                                </div>
                            </section>
                    </div>
                );
            case 'Contact Us':
                return (
                    <div className="p-4 bg-white">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Get in Touch with the HomeSpace Team</h2>
                        <div className="space-y-2 text-gray-700 text-sm">
                            <p>We're here to help! Feel free to reach out to our team using the following email addresses:</p>
                            <ul className="list-disc list-inside pl-4">
                                <li>
                                    <a 
                                        href="mailto:mb2169@hw.ac.uk" 
                                        className="text-blue-600 hover:underline"
                                    >
                                        mb2169@hw.ac.uk
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="mailto:lnb2000@hw.ac.uk" 
                                        className="text-blue-600 hover:underline"
                                    >
                                        lbn2000@hw.ac.uk
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="mailto:ha2051@hw.ac.uk" 
                                        className="text-blue-600 hover:underline"
                                    >
                                        ha2051@hw.ac.uk
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                );
            default:
                return <Profile />;
        }
    };

    const menuItems = [
        'Profile', 'Privacy Settings', 'My Goals', 'FAQ & Feedback', 'Contact Us'
    ];

    return (
        <div className='flex flex-row min-h-screen' style={{ paddingTop: '70px' }}>
            {/* Profile card */}
            <div className="w-32 md:w-64 xl:w-96 bg-gray-100 p-4 shadow-md">
                <div className="flex items-center bg-white border border-gray-300 rounded-lg p-3 mb-4">
                    <img
                        src={profileIcon}
                        alt="Profile"
                        className="w-8 h-8 rounded-full mr-4"
                    />
                    <div className="flex flex-col overflow-hidden">
                        <h2 className="text-sm font-medium truncate">{profile.firstName} {profile.lastName}</h2>
                        <p className="text-xs text-gray-600 truncate">{profile.email}</p>
                    </div>
                </div>
                <ul className="menu list-none p-0">
                    {menuItems.map(
                        (item) => (
                            <li
                                key={item}
                                className={`p-2 text-sm border-b-2 cursor-pointer hover:border-[#0056b3] hover:bg-gray-200 ${activeMenu === item ? 'bg-gray-200 font-semibold border-b-2 border-[#347DC1]' : 'border-gray-300'
                                    }`}
                                onClick={() => setActiveMenu(item)}
                            >
                                {item}
                            </li>
                        )
                    )}
                </ul>
            </div>
            {/* Main content */}
            <div className="flex-1 p-4 overflow-auto">{renderContent()}</div>
        </div>
    );
}

export default Settings;