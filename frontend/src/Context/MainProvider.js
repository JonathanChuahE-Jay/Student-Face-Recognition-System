import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { TooltipProvider } from '../Context/ToolTipContext';
import { AppProvider } from '../Context/AppProvider';
import { BrowserRouter as Router } from 'react-router-dom';

const CombinedProvider = ({ children }) => {
  return (
    <ChakraProvider>
      <AppProvider>
        <TooltipProvider>
          <Router>
            {children}
          </Router>
        </TooltipProvider>
      </AppProvider>
    </ChakraProvider>
  );
};

export default CombinedProvider;
