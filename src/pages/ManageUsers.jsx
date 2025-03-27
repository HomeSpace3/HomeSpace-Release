import { useEffect, useState, useRef } from "react";
import { db, auth } from "../pages/firebase";
import { doc, getDoc, updateDoc, arrayRemove, deleteField} from "firebase/firestore";

const ManageUsers = () => {
  const [members, setMembers] = useState([]);
  const [ownerId, setOwnerId] = useState("");
  const [homeId, setHomeId] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);  // Track which dropdown is open
  const [dropdownPositions, setDropdownPositions] = useState({});
  const currentUser = auth.currentUser;
  const buttonRefs = useRef({});
  const [permissionsToEdit, setPermissionsToEdit] = useState({});  // Store the permissions to edit for admins

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.error("User document does not exist!");
          return;
        }

        const userHomeId = userSnap.data().homeId;
        setHomeId(userHomeId);

        const homeRef = doc(db, "Homes", userHomeId);
        const homeSnap = await getDoc(homeRef);

        if (homeSnap.exists()) {
          const homeData = homeSnap.data();
          setOwnerId(homeData.ownerId);

          const memberDataPromises = homeData.members.map(async (id) => {
            const memberRef = doc(db, "Users", id);
            const memberSnap = await getDoc(memberRef);
            return { id, permissions: homeData.membersPermissions[id], ...memberSnap.data() };
          });

          const memberData = await Promise.all(memberDataPromises);
          setMembers(memberData);
        } else {
          console.error("Home document does not exist!");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [currentUser, ownerId, homeId]);

  const toggleDropdown = async (id) => {

    // Fetch the latest permissions from Firebase every time the dropdown is opened
    const homeRef = doc(db, "Homes", homeId);
    const homeSnap = await getDoc(homeRef);

    if (homeSnap.exists()) {
      const homeData = homeSnap.data();
      const latestPermissions = homeData.membersPermissions[id] || {};

      setPermissionsToEdit((prev) => ({
        ...prev,
        [id]: { ...latestPermissions },
      }));
    }

    setActiveDropdown((prev) => (prev === id ? null : id)); // Toggle the active dropdown

    if (id && buttonRefs.current[id]) {
      const rect = buttonRefs.current[id].getBoundingClientRect();
      setDropdownPositions((prev) => ({
        ...prev,
        [id]: {
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX,
        },
      }));
    }
  };

  const handlePermissionToggle = (id, permission) => {
    setPermissionsToEdit((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [permission]: !prev[id]?.[permission],
      },
    }));
  };

  const savePermissions = async (id) => {
    const userRef = doc(db, "Users", id);
    const homeRef = doc(db, "Homes", homeId);

    try {
      // Fetch the current permissions for the user
      const homeSnap = await getDoc(homeRef);
      const homeData = homeSnap.data();

      // Merge the new permissions with the existing ones
      const updatedPermissions = {
        ...homeData.membersPermissions[id], // Existing permissions
        ...permissionsToEdit[id], // Updated permissions
      };

      // Update the home document with the new permissions for the user
      await updateDoc(homeRef, {
        [`membersPermissions.${id}`]: updatedPermissions,
      });

      console.log("Permissions updated successfully!");
      setActiveDropdown(null);
    } catch (error) {
      console.error("Error updating permissions:", error);
    }
  };

  const cancelPermissions = (id) => {
    setActiveDropdown(null); // Close the dropdown without saving
  };

  const handleRemoveUser = async (userId) => {
    if (userId === ownerId) return alert("Owner cannot be removed!");
    if (!window.confirm("Are you sure you want to remove this user?")) return;

    try {
      const homeRef = doc(db, "Homes", homeId);
      const userRef = doc(db, "Users", userId);
      const [homeSnap, userSnap] = await Promise.all([getDoc(homeRef), getDoc(userRef)]);

      if (!homeSnap.exists()) {
        console.error("Home document does not exist!");
        return alert("Error: Home not found.");
      }
      if (!userSnap.exists()) {
        console.error("User document does not exist!");
        return alert("Error: User not found.");
      }

      await updateDoc(homeRef, {
        members: arrayRemove(userId),
        [`membersPermissions.${userId}`]: deleteField(),
      });

      await updateDoc(userRef, {
        homeId: null,
        isAdmin: false,
      });

      setMembers((prevMembers) => prevMembers.filter((member) => member.id !== userId));
      alert("User removed successfully!");
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove user");
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
    if (!homeId || !ownerId) return;
    if (!window.confirm("Are you sure you want to transfer ownership to this user?")) return;

    try {
      const homeRef = doc(db, "Homes", homeId);
      const homeSnap = await getDoc(homeRef);
      const homeData = homeSnap.data();
      const oldOwnerRef = doc(db, "Users", ownerId);
      const newOwnerRef = doc(db, "Users", newOwnerId);

      const oldOwnerPermissions = homeData.membersPermissions[ownerId] || {};

      await updateDoc(homeRef, {
        ownerId: newOwnerId,
        [`membersPermissions.${newOwnerId}`]: {
          addDevice: true,
          removeDevice: true,
          manageScenes: true,
          viewAnalytics: true,
        },
        [`membersPermissions.${ownerId}`]: {
          ...oldOwnerPermissions,
          removeDevice: false, // Remove this permission from old owner
        },
      });

      setOwnerId(newOwnerId);

      // Update User documents (change roles)
      await updateDoc(oldOwnerRef, { isAdmin: false });
      await updateDoc(newOwnerRef, { isAdmin: true });

      alert("Ownership transferred successfully!");
    } catch (error) {
      console.error("Error transferring ownership:", error);
      alert("Failed to transfer ownership");
    }
  };

  const renderPermissions = (permissions, id) => {
    const permissionList = [
      { name: "addDevice", label: "Add Device" },
      { name: "removeDevice", label: "Remove Device" },
      { name: "manageScenes", label: "Manage Scenes" },
      { name: "viewAnalytics", label: "View Analytics" },
    ];

    const isAdmin = currentUser?.uid === ownerId; // Check if the current user is an admin (home owner)

    return (
      <>
        <button
          ref={(el) => (buttonRefs.current[id] = el)}
          onClick={() => toggleDropdown(id)}
          className={`px-4 py-2 rounded-lg text-sm ${currentUser.uid === id ? "bg-blue-500 text-white hover:bg-blue-800" : "bg-gray-50 text-gray-700 hover:bg-gray-300"
            }`}
        >
          {activeDropdown === id ? "Hide Permissions" : isAdmin ? "Edit Permissions" : "View Permissions"}
        </button>

        {activeDropdown === id && dropdownPositions[id] && (
          <div
            className="fixed right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 w-48"
            style={{
              top: dropdownPositions[id].top,
              left: dropdownPositions[id].left,
            }}
          >
            <ul className="list-disc list-inside">
              {permissionList.map((perm) => (
                <li key={perm.name} className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <input
                        type="checkbox"
                        checked={permissionsToEdit[id]?.[perm.name] ?? permissions[perm.name]}
                        onChange={() => handlePermissionToggle(id, perm.name)}
                        className="mr-2"
                      />
                      {perm.label}
                    </>
                  ) : (
                    permissions[perm.name] && perm.label
                  )}
                </li>
              ))}
            </ul>
            {isAdmin && (
              <div className="mt-3 flex justify-center items-center w-full gap-2">
                <button
                  onClick={() => savePermissions(id)}
                  className="bg-blue-500 text-white px-3 py-1 text-sm rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => cancelPermissions(id)}
                  className="bg-gray-500 text-white px-3 py-1 text-sm rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto"  style={{ paddingTop: '70px' }}>
      <h1 className="text-2xl font-semibold text-center mt-6 mb-6">{currentUser?.uid === ownerId ? "Manage Users" : "View Users"}</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Permissions</th>
              {currentUser?.uid === ownerId && members.length > 1 ? <th className="p-4 text-left">Action</th> : <th></th>}
            </tr>
          </thead>
          <tbody>
            {members
              .sort((a, b) => (a.id === ownerId ? -1 : b.id === ownerId ? 1 : 0))
              .map((member) => (
                <tr key={member.id} className={`transition-colors ${member.id === currentUser.uid ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'}`}>
                  <td className="p-4 border-b border-gray-200">
                    {member.firstName} {member.lastName}{" "}
                    {member.id === ownerId && (
                      <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">Owner</span>
                    )}
                  </td>
                  <td className="p-4 border-b border-gray-200">{member.email}</td>
                  <td className="p-4 border-b border-gray-200">{member.isAdmin ? "Admin" : "User"}</td>
                  <td className="p-4 border-b border-gray-200">
                    {renderPermissions(member.permissions, member.id)}
                  </td>
                  {currentUser?.uid === ownerId && members.length > 1 ?
                    <td className="p-4 border-b border-gray-200">
                      {member.id !== ownerId ? <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveUser(member.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
                        >
                          Remove User
                        </button>
                        <button
                          onClick={() => handleTransferOwnership(member.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600"
                        >
                          Transfer Ownership
                        </button>
                      </div> : null}
                    </td> : <td></td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
