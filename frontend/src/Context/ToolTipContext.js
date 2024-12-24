import React, { createContext, useState, useContext } from 'react';

const TooltipContext = createContext();

export const TooltipProvider = ({ children }) => {
    const [isDisabled, setIsDisabled] = useState(false);

    return (
        <TooltipContext.Provider value={{ isDisabled, setIsDisabled }}>
            {children}
        </TooltipContext.Provider>
    );
};

export const useTooltip = () => useContext(TooltipContext);
