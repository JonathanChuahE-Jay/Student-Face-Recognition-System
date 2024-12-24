import React from 'react';
import { FormLabel, Switch } from '@chakra-ui/react';

const Color_Mode = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <>
      <FormLabel>Enable Darkmode?</FormLabel>
      <Switch 
        isChecked={isDarkMode} 
        onChange={() => setIsDarkMode(prev => !prev)} 
      />
    </>
  );
}

export default Color_Mode;
