import '../styles/DeviceSelectionList.css';

const capitalizeWords = (str) => {
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const DeviceSelectionList = ({ devices, onDeviceSelect, selectedDevices, onDeviceActionChange, onRemoveDevice }) => {
  const getActionOptions = (deviceType) => {
    const type = deviceType?.toLowerCase();
    switch (type) {
      case 'lights':
        return ['Turn On', 'Turn Off', 'Toggle'];
      case 'ac':
      case 'fan':
        return ['Turn On', 'Turn Off'];
      default:
        return ['Turn On', 'Turn Off'];
    }
  };

  const showTemperature = (deviceType, action) => {
    const type = deviceType?.toLowerCase();
    return (type === 'ac' || type === 'fan') && action === 'Turn On';
  };

  return (
    <div className="device-selection-list">
      <div className="available-devices">
        <h3>Available Devices</h3>
        <div className="devices-grid-scenes">
          {devices.map((device) => (
            <div
              key={device.id}
              className="device-item"
              onClick={() => {
                if (!selectedDevices.find(d => d.deviceId === device.id)) {
                  onDeviceSelect(device);
                }
              }}
            >
              <span className="device-name">{device.name}</span>
              <span className="device-type">{capitalizeWords(device.type)}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedDevices.length > 0 && (
        <div className="selected-devices">
          <h3>Selected Actions</h3>
          <div className="selected-devices-list">
            {selectedDevices.map((selectedDevice) => {
              const device = devices.find(d => d.id === selectedDevice.deviceId);
              return (
                <div key={selectedDevice.deviceId} className="selected-device-item">
                  <div className="device-info">
                    <span className="device-name">{device?.name}</span>
                    <button 
                      className="remove-device"
                      onClick={() => onRemoveDevice(selectedDevice.deviceId)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="device-actions">
                    <select
                      value={selectedDevice.action}
                      onChange={(e) => onDeviceActionChange(selectedDevice.deviceId, 'action', e.target.value)}
                      className="action-select"
                    >
                      {getActionOptions(device?.type).map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                    {showTemperature(device?.type, selectedDevice.action) && (
                      <div className="temperature-control">
                        <input
                          type="number"
                          min="16"
                          max="30"
                          value={selectedDevice.temperature || 24}
                          onChange={(e) => onDeviceActionChange(selectedDevice.deviceId, 'temperature', parseInt(e.target.value))}
                          className="temperature-input"
                        />
                        <span className="temperature-unit">°C</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSelectionList; 