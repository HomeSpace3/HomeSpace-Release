import { doc, updateDoc, arrayRemove, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../pages/firebase"; // Ensure correct Firestore import

export const leaveHome = async (userId, homeId, isAdmin) => {
  try {
    const homeRef = doc(db, "Homes", homeId);
    const userRef = doc(db, "Users", userId);

    const homeDoc = await getDoc(homeRef);
    if (!homeDoc.exists()) throw new Error("Home not found.");

    const homeData = homeDoc.data();
    const members = homeData.members || [];

    if (isAdmin) {
      if (members.length > 1) {
        throw new Error("Transfer home ownership before leaving.");
      } else {
        // Last member leaves → Delete home
        await deleteDoc(homeRef);
      }
    } else {
      // Remove user from home members list
      await updateDoc(homeRef, {
        members: arrayRemove(userId),
        [`membersPermissions.${userId}`]: null, // Remove permissions
      });
    }

    // Update user document
    await updateDoc(userRef, {
      homeId: null,
      isAdmin: false,
    });

    return "Success";
  } catch (error) {
    console.error("Error leaving home:", error);
    throw error;
  }
};
