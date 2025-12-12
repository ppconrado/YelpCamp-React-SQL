import { useEffect, useCallback } from 'react';

/**
 * Hook to prompt user before leaving page with unsaved changes
 * @param {boolean} isDirty - Whether the form has unsaved changes
 * @param {string} message - Custom warning message
 */
export const useUnsavedChanges = (
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?'
) => {
  const handleBeforeUnload = useCallback(
    (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    },
    [isDirty, message]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleBeforeUnload]);
};
