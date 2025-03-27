import devicesIcon from '../assets/devices.svg';
import energyIcon from '../assets/energy.svg';
import scenesIcon from '../assets/scenes.svg';

// new navbar to use in place of old one
// On larger screens a navbar is used
// On smaller screens it changes to a footerbar
// functions the same for routing between 'devices' 'energy' and 'scenes'

const Navigation = ({ activeSection, setActiveSection }) => {
  const tabs = [
    { id: 'DeviceGrid', label: 'Devices', icon: devicesIcon },
    { id: 'Energy', label: 'Energy', icon: energyIcon },
    { id: 'Scenes', label: 'Scenes', icon: scenesIcon }
  ];

  return (
    <>
      {/* Desktop Navigation (Navbar style) */}
      <nav className="hidden md:block w-full h-14 z-50 shadow-lg font-mono">
        <div className="flex h-full">
          {tabs.map((tab) => (
            <button
              key={`desktop-${tab.id}`}
              onClick={() => setActiveSection(tab.id)}
              className={`
                flex flex-col items-center justify-center
                basis-1/3 px-4 space-y-[-2]
                transition-all duration-100
                ${
                  activeSection === tab.id
                    ? 'text-[#2a679f] border-b-2 border-[#347DC1]'
                    : 'text-gray-900 hover:bg-opacity-60 hover:border-b-2 hover:border-opacity-50 hover:border-[#347DC1]'
                }
                bg-white desktop-nav-button`}
                data-target={tab.id}
            >
              <img
                src={tab.icon}
                alt={`${tab.label} icon`}
                className={`w-5 h-5 pt-1 ${
                  activeSection === tab.id
                    ? 'filter invert-0 sepia-0 saturate-[500] hue-rotate-[20deg] brightness-[0.1] contrast-100'
                    : 'filter invert-0 sepia-0 hue-rotate-[20deg] brightness-[0.1] contrast-100'
                }`}
              />
              <span className="mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation (FooterBar style) */}
      <div className="md:hidden flex fixed bottom-0 left-0 right-0 pb-4 justify-center z-50">
        <footer className="border-2 border-opacity-40 border-[#347DC1] bg-white rounded-full shadow-lg px-6 py-2">
          <div className="flex items-center gap-8">
            {tabs.map((tab) => (
              <button
                key={`mobile-${tab.id}`}
                onClick={() => setActiveSection(tab.id)}
                className={`
                  flex flex-col items-center gap-1 px-2 py-1
                  transition-colors duration-200
                  mobile-nav-button
                  ${
                    activeSection === tab.id
                      ? 'text-[#347DC1]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  data-target={tab.id}
              >
                <img
                  src={tab.icon}
                  alt={`${tab.label} icon`}
                  className={`w-5 h-5 ${
                    activeSection === tab.id
                      ? 'filter invert-0 sepia-0 saturate-[500] hue-rotate-[20deg] brightness-[0.1] contrast-100'
                      : 'filter brightness-0 opacity-50'
                  }`}
                />
                <span className="text-sm font-medium">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
};

export default Navigation;