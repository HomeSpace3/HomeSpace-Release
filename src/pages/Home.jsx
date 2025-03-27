import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import Navigation from '../components/NewNav';
import DeviceGrid from './DeviceGrid';
import Energy from './Energy';
import Scenes from './Scenes';
import '../Styles/Home.css';

const Home = () => {
  const [activeSection, setActiveSection] = useState('DeviceGrid');
  const [homeId, setHomeId] = useState(null); 
  const [loading, setLoading] = useState(true); 

  // fetch user's homeId from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser; // get the currently logged-in user
      if (user) {
        const userDocRef = doc(db, 'Users', user.uid); 
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setHomeId(userData.homeId); // set the homeId from the user document
        } else {
          console.log('User document not found');
        }
      }
      setLoading(false); 
    };

    fetchUserData();
  }, []);

  const renderSection = () => {
    if (loading) {
      return <p>Loading...</p>;
    }

    switch (activeSection) {
      case 'DeviceGrid':
        return <DeviceGrid homeId={homeId} />;
      case 'Energy':
        return <Energy homeId={homeId} />;
      case 'Scenes':
        return <Scenes homeId={homeId} />;
      default:
        return <DeviceGrid homeId={homeId} />;
    }
  };

  return (
    <div style={{ paddingTop: '70px' }}>
      <Navigation
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div className="mt-2 pb-20 md:pb-4">
        {renderSection()}
      </div>
    </div>
  );
};

export default Home;