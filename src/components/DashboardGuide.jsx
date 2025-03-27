import React, { useState, useEffect } from "react";
import Joyride from "react-joyride";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../pages/firebase";

const DashboardGuide = () => {
  const [run, setRun] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const user = getAuth().currentUser;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      checkTutorialStatus();
    }
  }, [user]);

  const disableScroll = () => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.style.overflow = "hidden";
      mainContent.style.height = "calc(100vh - 60px)";
    }
  };

  const enableScroll = () => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.style.overflow = "";
      mainContent.style.height = "";
    }
  };

  const checkTutorialStatus = async () => {
    try {
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && !userDoc.data().hasSeenDashboardGuide) {
        setRun(true);
        disableScroll();
      }
    } catch (error) {
      console.error("Error fetching user document:", error);
    }
  };

  const handleJoyrideCallback = (data) => {
    const { status, index, action, type } = data;
  
    // Debug: Log all callback events to understand what's happening
    console.log("Joyride callback:", { status, index, action, type });
  
    // Debug: Log the current step and target element
    if (action === "next" || action === "prev" || action === "start") {
      const currentStep = steps[index];
      const targetElement = document.querySelector(currentStep.target);
      console.log(`Step ${index}: Targeting ${currentStep.target}`);
      console.log("Target element found:", targetElement);
    }
  
    // Handle close or skip actions
    if (
      (type === "step:after" && (action === "close" || action === "skip")) ||
      (type === "tour:end" && status === "skipped") // Catch the skip event at tour end
    ) {
      console.log("Close or Skip action detected, showing confirmation dialog");
      handleConfirmExit();
      return;
    }
  
    // Handle completion of the tutorial
    if (["finished", "skipped"].includes(status) && user) {
      const userDocRef = doc(db, "Users", user.uid);
      updateDoc(userDocRef, { hasSeenDashboardGuide: true });
      setRun(false);
      enableScroll();
    }
  };

  const handleConfirmExit = () => {
    // User confirmed they want to exit
    setRun(false);
    enableScroll();
    if (user) {
      const userDocRef = doc(db, "Users", user.uid);
      updateDoc(userDocRef, { hasSeenDashboardGuide: true });
    }
  };

  const steps = [
    {
      target: "body",
      content: "Welcome to the HomeSpace Dashboard Tutorial! Let’s explore the powerful features that will help you manage your smart home effortlessly.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: ".menu-button",
      content: "Click here to access user permissions and home settings.",
      placement: "bottom",
    },
    {
      target: ".profile-button",
      content: "Your profile settings live here—update your personal details or preferences with a quick click!",
      placement: "top",
    },
    {
      target: isMobile ? '.mobile-nav-button[data-target="DeviceGrid"]' : '.desktop-nav-button[data-target="DeviceGrid"]',
      content: "You are currently in the Devices tab where you can add and control your smart devices. Click on any device to view and edit its details, like settings or status.",
      placement: isMobile ? "top" : "top",
    },
    {
      target: isMobile ? '.mobile-nav-button[data-target="Energy"]' : '.desktop-nav-button[data-target="Energy"]',
      content: "Visit the Energy tab to track timely energy usage for your entire home or individual devices, plus get insights and suggestions to save energy.",
      placement: isMobile ? "top" : "top",
    },
    {
      target: isMobile ? '.mobile-nav-button[data-target="Scenes"]' : '.desktop-nav-button[data-target="Scenes"]',
      content: "On the Scenes tab, you can automate your home by creating scenes to control multiple devices at once.",
      placement: isMobile ? "top" : "top",
    },
  ];

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        scrollToFirstStep
        scrollOffset={60}
        disableScrollParentFix={false}
        disableOverlayClose
        callback={handleJoyrideCallback}
        showProgress
        showSkipButton
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip Tutorial",
        }}
        styles={{
          options: {
            zIndex: 2000,
            primaryColor: "#1a73e8",
          },
        }}
      />
    </>
  );
};

export default DashboardGuide;