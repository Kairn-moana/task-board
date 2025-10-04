import React, { createContext, useState, useContext, useEffect } from "react";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    simpleMode: false,
    reduceAnimations: false,
    largeClickAreas: false,
    highContrast: false,
  });

  useEffect(() => {
    // Apply global attributes to the body or root element based on settings
    document.body.dataset.reduceAnimations = settings.reduceAnimations;
    document.body.dataset.largeClickAreas = settings.largeClickAreas;
    document.body.dataset.highContrast = settings.highContrast;
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
