import { useState, useEffect } from "react";
import { db, auth } from "../pages/firebase";
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection, writeBatch } from "firebase/firestore";

const HomeSettings = () => {
    const [homeName, setHomeName] = useState("");
    const [notifications, setNotifications] = useState({ energy: true, security: true });
    const [ownerId, setOwnerId] = useState("");
    const [homeId, setHomeId] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [activeTab, setActiveTab] = useState("homeInfo");
    const currentUser = auth.currentUser;

    useEffect(() => {
        const fetchHomeSettings = async () => {
            const userRef = doc(db, "Users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            const homeId = userSnap.data().homeId;

            const homeRef = doc(db, "Homes", homeId);
            const homeSnap = await getDoc(homeRef);
            if (homeSnap.exists()) {
                const homeData = homeSnap.data();
                setHomeName(homeData.homeName);
                setHomeId(homeId);
                setCreatedAt(homeData.createdAt.toDate().toDateString());
                setNotifications(homeData.notifications || { energy: true, security: true });
                setOwnerId(homeData.ownerId);

                const ownerRef = doc(db, "Users", homeData.ownerId);
                const ownerSnap = await getDoc(ownerRef);
                if (ownerSnap.exists()) {
                    setOwnerName(ownerSnap.data().firstName + " " + ownerSnap.data().lastName);
                }
            }
        };
        fetchHomeSettings();
    }, []);

    const copyToClipboard = () => {
        const textField = document.createElement("textarea");
        textField.value = homeId;
        document.body.appendChild(textField);
        textField.select();
        document.execCommand("copy");
        document.body.removeChild(textField);
        alert("Home ID Copied!");
    };
    

    const handleSave = async () => {
        const homeRef = doc(db, "Homes", homeId);
        try {
            await updateDoc(homeRef, { homeName, notifications });
            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Error updating settings:", error);
            alert("Failed to update settings");
        }
    };

    // function to gracefully handle the deletion of a home
    const handleDeleteHome = async () => {
        if (currentUser.uid !== ownerId) {
            return alert("Only the owner can delete the home");
        }
        if (!window.confirm("Are you sure you want to delete this home?")) return;

        try {
            const homeRef = doc(db, "Homes", homeId);
            const homeSnap = await getDoc(homeRef);

            if (!homeSnap.exists()) {
                return alert("Home does not exist");
            }

            const homeData = homeSnap.data();
            const members = homeData.members || [];
            const batch = writeBatch(db);

            // first remove homeId from all members' documents
            for (const userId of members) {
                const userRef = doc(db, "Users", userId);
                batch.update(userRef, { homeId: null });
            }

            // then remove `isAdmin` field for the owner
            const ownerRef = doc(db, "Users", ownerId);
            batch.update(ownerRef, { isAdmin: false });

            // commit member updates first
            await batch.commit();

            // function to then delete nested sub-collections
            const deleteSubCollection = async (subCollectionPath) => {
                const subCollectionRef = collection(db, subCollectionPath);
                const snapshot = await getDocs(subCollectionRef);

                const deleteBatch = writeBatch(db);
                snapshot.forEach((doc) => {
                    deleteBatch.delete(doc.ref);
                });

                await deleteBatch.commit();
            };

            // delete all documents in the subcollections
            await deleteSubCollection(`Homes/${homeId}/devices`);
            await deleteSubCollection(`Homes/${homeId}/energyRecords`);
            await deleteSubCollection(`Homes/${homeId}/scenes`);

            // finally delete the home document itself
            await deleteDoc(homeRef);

            alert("Home deleted successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Error deleting home:", error);
            alert("Failed to delete home");
        }
    };


    return (
        <>
        <h1 className="text-2xl font-semibold text-center mb-4 mt-12"  style={{ paddingTop: '70px' }}>Home Settings</h1>
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
            <div className="flex flex-col md:flex-row space-x-4">
                <div className="w-full md:w-1/3 mb-4 md:mb-0">
                    <div className="space-y-2">
                        <button 
                            className={`w-full p-2 text-left ${activeTab === "homeInfo" ? "bg-[#347DC1] text-white" : "bg-gray-100"}`} 
                            onClick={() => setActiveTab("homeInfo")}>
                            Home Information
                        </button>
                        <button 
                            className={`w-full p-2 text-left ${activeTab === "notifications" ? "bg-[#347DC1] text-white" : "bg-gray-100"}`} 
                            onClick={() => setActiveTab("notifications")}>
                            Notification Preferences
                        </button>
                    </div>
                </div>
                <div className="w-full md:w-2/3 p-4">
                    {activeTab === "homeInfo" && (
                        <div className="space-y-4">
                            <label className="block font-semibold">Home Name</label>
                            <input type="text" value={homeName} 
                                disabled={currentUser.uid !== ownerId} 
                                onChange={(e) => setHomeName(e.target.value)} 
                                className="w-full p-2 border rounded-lg" />
                            <label className="block font-semibold">Home ID</label>
                            <div className="flex items-center space-x-2">
                                <input type="text" value={homeId} disabled className="w-full p-2 border rounded-lg" />
                                <button onClick={copyToClipboard} className="bg-[#347DC1] text-white px-4 py-2 rounded-lg">Copy</button>
                            </div>
                            <label className="block font-semibold">Owner Name</label>
                            <input type="text" value={ownerName} disabled className="w-full p-2 border rounded-lg" />
                            <p><strong>Creation Date:</strong> {createdAt}</p>
                        </div>
                    )}
                    {activeTab === "notifications" && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Notification Preferences</h2>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" checked={notifications.energy} 
                                    disabled={currentUser.uid !== ownerId} 
                                    onChange={() => setNotifications({...notifications, energy: !notifications.energy})} />
                                <span>Energy Alerts</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" checked={notifications.security} 
                                    disabled={currentUser.uid !== ownerId} 
                                    onChange={() => setNotifications({...notifications, security: !notifications.security})} />
                                <span>Security Alerts</span>
                            </div>
                        </div>
                    )}
                    {currentUser.uid === ownerId && ( <> <button onClick={handleSave} className="w-full bg-green-500 text-white p-2 rounded-lg mt-4">Save Settings</button>
                        <div className="flex space-x-4 mt-4">
                            <button className="w-1/2 bg-yellow-500 text-white p-2 rounded-lg">Reset Home</button>
                            <button onClick={handleDeleteHome} className="w-1/2 bg-red-500 text-white p-2 rounded-lg">Delete Home</button>
                        </div> </>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

export default HomeSettings;
