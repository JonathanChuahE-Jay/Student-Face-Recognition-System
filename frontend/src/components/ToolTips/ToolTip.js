import React from "react";
import { FormLabel, Switch } from "@chakra-ui/react";

const ToolTip = ({ isTooltipEnabled, setIsTooltipEnabled }) => {
    return (
        <>
            <FormLabel>Enable Tooltip?</FormLabel>
            <Switch 
                isChecked={isTooltipEnabled} 
                onChange={() => setIsTooltipEnabled(prev => !prev)} 
            />
        </>
    );
};

export default ToolTip;
