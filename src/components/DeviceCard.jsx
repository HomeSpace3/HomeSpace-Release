import { Lightbulb, AirVent, HousePlug, Power } from "lucide-react";
import PropTypes from 'prop-types';

const DeviceCard = ({ device, onClick, toggleDeviceStatus }) => {
  // get corresponding device icon
  const getDeviceIcon = (type, status) => {
    switch (type) {
      case "Ac":
        return <AirVent size={32} className={status ? "text-[#347DC1]" : "text-gray-400"} />;
      case "Lights":
        return <Lightbulb size={32} className={status ? "text-[#347DC1]" : "text-gray-400"} />;
      default:
        return <HousePlug size={32} className={status ? "text-[#347DC1]" : "text-gray-400"} />;
    }
  };

  return (
    <>
      {/* device card for small Screens */}
      <div
        className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:bg-gray-50 ${
          device.status ? "border-l-4 border-[#347DC1] transition-all" : "transition-all"
        } sm:hidden`} // hidden on large screens
        onClick={() => onClick(device)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-full">
              {getDeviceIcon(device.type, device.status)}
            </div>
            <div>
              <p className="font-semibold text-lg">{device.name}</p>
              <p className="text-sm text-gray-500">{device.type}</p>
            </div>
          </div>
          <div
            className={`p-2 rounded-full cursor-pointer ${device.status ? "text-[#347DC1]" : "text-gray-400"}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent click event from triggering the card click
              toggleDeviceStatus(device.id, device.status);
            }}
          >
            <Power
              size={28}
              className={`transition-all ${device.status ? "scale-110" : "scale-100"}`} 
            />
          </div>
        </div>
      </div>

      {/* Large Screens */}
      <div
        className={`hidden sm:block bg-white rounded-xl shadow-md p-6 cursor-pointer hover:bg-gray-50 ${
          device.status ? "border-2 border-[#347DC1] transition-all" : "border-2 border-gray-400 border-opacity-50 transition-all"
        } aspect-square`} 
        onClick={() => onClick(device)}
      >
        <div className="flex flex-col h-full justify-between items-center">
          <p className="font-semibold text-md text-center truncate w-full">
            {device.name}
          </p>

          <div className=" rounded-full">
            {getDeviceIcon(device.type, device.status)}
          </div>

          {/* Slider Switch */}
          <div
            className={`relative w-12 h-6 rounded-full cursor-pointer ${
              device.status ? "bg-[#347DC1]" : "bg-gray-300"
            }`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent click event from triggering the card click
              toggleDeviceStatus(device.id, device.status);
            }}
          >
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                device.status ? "translate-x-6" : "translate-x-1"
              }`}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

DeviceCard.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.bool.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  toggleDeviceStatus: PropTypes.func.isRequired,
};

export default DeviceCard;