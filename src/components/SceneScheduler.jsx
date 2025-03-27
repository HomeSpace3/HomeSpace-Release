import { useEffect } from 'react';
import { db } from "../pages/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const SceneScheduler = ({ homeId, executeScene }) => {
  useEffect(() => {
    const checkTimeBasedScenes = async () => {
      if (!homeId) return;

      try {
        const scenesRef = collection(db, `Homes/${homeId}/scenes`);
        const timeBasedScenesQuery = query(scenesRef, where("type", "==", "Time"));
        const snapshot = await getDocs(timeBasedScenesQuery);
        
        const currentTime = new Date();
        const currentHourMinute = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

        snapshot.docs.forEach(doc => {
          const scene = { id: doc.id, ...doc.data() };
          if (scene.triggerTime === currentHourMinute) {
            executeScene(scene);
          }
        });
      } catch (error) {
        console.error('Error checking time-based scenes:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkTimeBasedScenes, 60000);
    
    // Initial check
    checkTimeBasedScenes();

    return () => clearInterval(interval);
  }, [executeScene, homeId]);

  return null;
};

export default SceneScheduler; 