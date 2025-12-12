/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';
import toast from 'react-hot-toast';

const FlashContext = createContext();

export const useFlash = () => useContext(FlashContext);

export const FlashProvider = ({ children }) => {
  const showFlash = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  const clearFlash = () => {
    toast.dismiss();
  };

  return (
    <FlashContext.Provider
      value={{ showFlash, clearFlash, flashMessage: null }}
    >
      {children}
    </FlashContext.Provider>
  );
};
