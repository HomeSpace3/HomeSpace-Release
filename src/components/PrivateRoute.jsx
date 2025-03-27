import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext'; // Authentication hook
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../pages/firebase';

const PrivateRoute = ({ children, allowWithoutHome = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [userHasHome, setUserHasHome] = useState(null);

  useEffect(() => {
      if (!user) {
        setUserHasHome(false);
        return;
      }

      // real-time listener on user's document
      const userDocRef = doc(db, "Users", user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const homeId = docSnapshot.data().homeId;
          setUserHasHome(!!homeId); // true if homeId exists, false otherwise
        } else {
          setUserHasHome(false);
        }
      });

      return () => unsubscribe(); // Cleanup listener on component unmount

  }, [user]);

  if (userHasHome === null) return null;

  if (!user) return <Navigate to="/" />;

  // restrict users with a home from accessing `/home-setup` if they've already navigated to `/home`
  if (userHasHome && location.pathname === "/home-setup" && !localStorage.getItem("homeCreationInProgress")) {
    return <Navigate to="/home" />;
  }

  // restrict users without a home from accessing other pages
  if (!userHasHome && !allowWithoutHome) {
    return <Navigate to="/home-setup" />;
  }

  return children;
};

export default PrivateRoute;
