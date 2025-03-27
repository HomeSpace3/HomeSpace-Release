import { useState, useRef, useEffect } from 'react';
import '../styles/CircularSlider.css';
import { db } from "../pages/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore"; 

const CircularSlider = ({ homeId, deviceId, temperature, setTemperature }) => { 
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);
  const prevAngleRef = useRef(null);


  useEffect(() => {
    if (!homeId || !deviceId) return; 

    const fetchFanDevice = async () => {

      const fanDeviceRef = doc(db, `Homes/${homeId}/devices`, deviceId);
      const fanDeviceSnap = await getDoc(fanDeviceRef);

      if (fanDeviceSnap.exists()) {
        const fanDevice = fanDeviceSnap.data();
        setTemperature(fanDevice.temperature?.value || 23);
      }
    };

    fetchFanDevice();
  }, [homeId, deviceId]);


  useEffect(() => {
    if (homeId && deviceId) {
      const fanDeviceRef = doc(db, `Homes/${homeId}/devices`, deviceId); 
      updateDoc(fanDeviceRef, {
        temperature: { value: `${temperature}` },
        lastUpdated: new Date().toISOString(), 
      })
        .then(() => {
          console.log('Temperature updated successfully!');
        })
        .catch((error) => {
          console.error('Error updating temperature:', error);
        });
    }
  }, [temperature, homeId, deviceId]);

  const strokeWidth = 37;
  const centerX = 300;
  const centerY = 300;
  const radius = 250;
  
  
  const MIN_TEMP = 5;
  const MAX_TEMP = 35;
  const MIN_ANGLE = -150;
  const MAX_ANGLE = 150;
  
  const tempToAngle = (temp) => {
    const angleRange = MAX_ANGLE - MIN_ANGLE;
    return MIN_ANGLE + (angleRange * (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP));
  };
  
  const calculateHandlePosition = (angle) => {
    const radians = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(radians),
      y: centerY + radius * Math.sin(radians)
    };
  };
  
  const generateArc = (startAngle, endAngle) => {
    const start = calculateHandlePosition(startAngle);
    const end = calculateHandlePosition(endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const getAngleFromPoint = (x, y) => {
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
    
    if (angle > 180) angle -= 360;
    
    return angle;
  };
  
  const handleInteractionStart = (event) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    
    const clientX = event.type.includes('touch') 
      ? event.touches[0].clientX 
      : event.clientX;
    const clientY = event.type.includes('touch') 
      ? event.touches[0].clientY 
      : event.clientY;
    
    pt.x = clientX;
    pt.y = clientY;
    
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    prevAngleRef.current = getAngleFromPoint(svgP.x, svgP.y);
    
    setIsDragging(true);
  };
  
  const handleInteractionMove = (event) => {
    if (!isDragging) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    
    const clientX = event.type.includes('touch') 
      ? event.touches[0].clientX 
      : event.clientX;
    const clientY = event.type.includes('touch') 
      ? event.touches[0].clientY 
      : event.clientY;
    
    pt.x = clientX;
    pt.y = clientY;
    
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const currentAngle = getAngleFromPoint(svgP.x, svgP.y);
    
    if (currentAngle >= MIN_ANGLE && currentAngle <= MAX_ANGLE) {
      const angleRange = MAX_ANGLE - MIN_ANGLE;
      const newTemp = MIN_TEMP + ((currentAngle - MIN_ANGLE) / angleRange) * (MAX_TEMP - MIN_TEMP);
      const roundedTemp = Math.round(Math.max(MIN_TEMP, Math.min(MAX_TEMP, newTemp)));
      setTemperature(roundedTemp);
      prevAngleRef.current = currentAngle;
    } else {
      const clampedAngle = currentAngle < MIN_ANGLE ? MIN_ANGLE : MAX_ANGLE;
      const angleRange = MAX_ANGLE - MIN_ANGLE;
      const newTemp = MIN_TEMP + ((clampedAngle - MIN_ANGLE) / angleRange) * (MAX_TEMP - MIN_TEMP);
      setTemperature(Math.round(newTemp));
      prevAngleRef.current = clampedAngle;
    }
  };
  
  const handleInteractionEnd = () => {
    setIsDragging(false);
    prevAngleRef.current = null;
  };
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleInteractionMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchmove', handleInteractionMove);
      window.addEventListener('touchend', handleInteractionEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleInteractionMove);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isDragging]);
  
  const currentAngle = tempToAngle(temperature);
  const handlePos = calculateHandlePosition(currentAngle);

  const viewBoxSize = centerX * 2;
  
  return (
    <div className="slider-container">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="slider-svg"
      >
       
        <path
          d={generateArc(MIN_ANGLE, MAX_ANGLE)}
          className="background-arc"
          strokeWidth={strokeWidth}
        />
        
      
        <defs>
         <linearGradient id="temp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#347DC1" />
            <stop offset="100%" stopColor="#BF5EAA" />
          </linearGradient>
        </defs>
        
       
        <path
          d={generateArc(MIN_ANGLE, currentAngle)}
          className="active-arc"
          stroke="url(#temp-gradient)"
          strokeWidth={strokeWidth}
        />
        
       
        <g transform={`translate(${centerX}, ${centerY})`}>
          <circle r="80" className="center-circle" />
          
          <g transform="translate(-12, -12)">
            <path
              d="M12 2L12 22M8 6L16 6"
              className="power-icon"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <text 
            y="10" 
            textAnchor="middle" 
            className="temperature-text"
          >
            {temperature}°C
          </text>
        </g>
        
       
        <circle
          cx={handlePos.x}
          cy={handlePos.y}
          r="15"
          className="handle"
          onMouseDown={handleInteractionStart}
          onTouchStart={handleInteractionStart}
        />
      </svg>
      
      
      <div className="controls">
        <button
          className="control-button"
          onClick={() => setTemperature(Math.max(MIN_TEMP, temperature - 1))}
        >
          -
        </button>
        <button
          className="control-button"
          onClick={() => setTemperature(Math.min(MAX_TEMP, temperature + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default CircularSlider;