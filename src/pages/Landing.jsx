import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Landing.css';
import deviceImage from '../assets/device-image-landing.svg';
import checkMark from '../assets/checkMark.svg';
import featuresCard from '../assets/landing-features-card.svg';
import leanrCard from '../assets/landing-learnmore.svg';

const Landing = () => {
  return (
    <div style={{ paddingTop: '70px' }} className='landing-container'>

      <div className='landing-section-1'>
        <div className='landing-welcome'><h1>Welcome to </h1><h1 className='landing-welcome-blue'>HomeSpace</h1></div>
        <div className='landing-subtext'><p>The perfect smart home app for energy efficiency, security, and seamless automation. Control devices, track energy consumption, and get real-time security alerts all from anywhere. </p></div>
        <img src={deviceImage} alt="Device Use Case Image" className="landing-device" />
      </div>

      <div className='landing-section-2' id='about'>
        <div className='landing-about-text'>
          <h1 className='landing-about-title' >About HomeSpace</h1>
          <div className='landing-about-listitem'><img src={checkMark} alt="Check Mark" className="landing-check" /><p>Transform your home</p></div>
          <div className='landing-about-listitem'><img src={checkMark} alt="Check Mark" className="landing-check" /><p>Real-time monitoring</p></div>
          <div className='landing-about-listitem'><img src={checkMark} alt="Check Mark" className="landing-check" /><p>Seamless control</p></div>
          <div className='landing-about-listitem'><img src={checkMark} alt="Check Mark" className="landing-check" /><p>Remote Access</p></div>
        </div>
      </div>

      <div className='landing-section-3' id='features'>
        <div className='landing-about-text'>
          <h1 className='landing-about-title' >Features</h1>
        </div>
        <img src={featuresCard} alt="HomeSpace Features Card" className="landing-features" />
      </div>

      <div className='landing-section-4' id='learn'>
        <img src={leanrCard} alt="Learn More Card" className="landing-learn" />
      </div>

      <footer>
        <div className='landing-footer'>
          <svg id="landing-icons" width="144" height="24" viewBox="0 0 144 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.2737 10.1635L23.2023 0H21.0872L13.3313 8.82305L7.14125 0H0L9.3626 13.3433L0 24H2.11504L10.3002 14.6806L16.8388 24H23.98M2.8784 1.5619H6.12769L21.0856 22.5148H17.8355" fill="#1E1E1E" />
            <g clip-path="url(#clip0_323_3538)">
              <path d="M51.9805 2.163C55.1845 2.163 55.5645 2.175 56.8305 2.233C60.0825 2.381 61.6015 3.924 61.7495 7.152C61.8075 8.417 61.8185 8.797 61.8185 12.001C61.8185 15.206 61.8065 15.585 61.7495 16.85C61.6005 20.075 60.0855 21.621 56.8305 21.769C55.5645 21.827 55.1865 21.839 51.9805 21.839C48.7765 21.839 48.3965 21.827 47.1315 21.769C43.8715 21.62 42.3605 20.07 42.2125 16.849C42.1545 15.584 42.1425 15.205 42.1425 12C42.1425 8.796 42.1555 8.417 42.2125 7.151C42.3615 3.924 43.8765 2.38 47.1315 2.232C48.3975 2.175 48.7765 2.163 51.9805 2.163ZM51.9805 0C48.7215 0 48.3135 0.014 47.0335 0.072C42.6755 0.272 40.2535 2.69 40.0535 7.052C39.9945 8.333 39.9805 8.741 39.9805 12C39.9805 15.259 39.9945 15.668 40.0525 16.948C40.2525 21.306 42.6705 23.728 47.0325 23.928C48.3135 23.986 48.7215 24 51.9805 24C55.2395 24 55.6485 23.986 56.9285 23.928C61.2825 23.728 63.7105 21.31 63.9075 16.948C63.9665 15.668 63.9805 15.259 63.9805 12C63.9805 8.741 63.9665 8.333 63.9085 7.053C63.7125 2.699 61.2915 0.273 56.9295 0.073C55.6485 0.014 55.2395 0 51.9805 0ZM51.9805 5.838C48.5775 5.838 45.8185 8.597 45.8185 12C45.8185 15.403 48.5775 18.163 51.9805 18.163C55.3835 18.163 58.1425 15.404 58.1425 12C58.1425 8.597 55.3835 5.838 51.9805 5.838ZM51.9805 16C49.7715 16 47.9805 14.21 47.9805 12C47.9805 9.791 49.7715 8 51.9805 8C54.1895 8 55.9805 9.791 55.9805 12C55.9805 14.21 54.1895 16 51.9805 16ZM58.3865 4.155C57.5905 4.155 56.9455 4.8 56.9455 5.595C56.9455 6.39 57.5905 7.035 58.3865 7.035C59.1815 7.035 59.8255 6.39 59.8255 5.595C59.8255 4.8 59.1815 4.155 58.3865 4.155Z" fill="#1E1E1E" />
            </g>
            <g clip-path="url(#clip1_323_3538)">
              <path d="M99.5955 3.18413C95.9915 2.93813 87.9645 2.93913 84.3655 3.18413C80.4685 3.45013 80.0095 5.80412 79.9805 12.0001C80.0095 18.1851 80.4645 20.5491 84.3655 20.8161C87.9655 21.0611 95.9915 21.0621 99.5955 20.8161C103.492 20.5501 103.951 18.1961 103.98 12.0001C103.951 5.81512 103.496 3.45113 99.5955 3.18413ZM88.9805 16.0001V8.00013L96.9805 11.9931L88.9805 16.0001Z" fill="#1E1E1E" />
            </g>
            <g clip-path="url(#clip2_323_3538)">
              <path d="M138.98 0H124.98C122.219 0 119.98 2.239 119.98 5V19C119.98 21.761 122.219 24 124.98 24H138.98C141.742 24 143.98 21.761 143.98 19V5C143.98 2.239 141.742 0 138.98 0ZM127.98 19H124.98V8H127.98V19ZM126.48 6.732C125.514 6.732 124.73 5.942 124.73 4.968C124.73 3.994 125.514 3.204 126.48 3.204C127.446 3.204 128.23 3.994 128.23 4.968C128.23 5.942 127.447 6.732 126.48 6.732ZM139.98 19H136.98V13.396C136.98 10.028 132.98 10.283 132.98 13.396V19H129.98V8H132.98V9.765C134.376 7.179 139.98 6.988 139.98 12.241V19Z" fill="#1E1E1E" />
            </g>
            <defs>
              <clipPath id="clip0_323_3538">
                <rect width="24" height="24" fill="white" transform="translate(39.9805)" />
              </clipPath>
              <clipPath id="clip1_323_3538">
                <rect width="24" height="24" fill="white" transform="translate(79.9805)" />
              </clipPath>
              <clipPath id="clip2_323_3538">
                <rect width="24" height="24" fill="white" transform="translate(119.98)" />
              </clipPath>
            </defs>
          </svg>
          <p>Copyright 2025. All Rights Reserved. HomeSpace.</p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;