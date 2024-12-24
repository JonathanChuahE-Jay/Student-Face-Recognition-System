import React, { useState } from "react";
import { Box, Heading, Button, useToast, VStack, Tooltip, Flex } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom"; 
import ToolTip from '../ToolTips/ToolTip';
import ColorMode from '../ColorMode/Color_Mode';
import { useTooltip } from '../../Context/ToolTipContext';
import { useColorMode } from '@chakra-ui/react';

const Settings = () => {
    const toast = useToast();
    const navigate = useNavigate(); 
    const { setIsDisabled,isDisabled } = useTooltip();
    const { setColorMode } = useColorMode();

    const [isTooltipEnabled, setIsTooltipEnabled] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const handleSave = () => {
        setIsDisabled(!isTooltipEnabled);
        
        setColorMode(isDarkMode ? "dark" : "light"); 

        toast({
        title: "Settings saved.",
        description: "Your settings have been updated successfully.",
        status: "success",
        duration: 2000,
        isClosable: true,
        });
    };

    return (
        <Flex p={5} height='90vh' flexDirection='column'>
        <Heading mb={5}>Settings</Heading>
        
        <VStack spacing={4} align="stretch">
            <ToolTip 
            isTooltipEnabled={isTooltipEnabled} 
            setIsTooltipEnabled={setIsTooltipEnabled} 
            />
            <ColorMode 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            />
        </VStack>

        <Flex justifyContent='space-between' mt='auto'>
            <Button 
                colorScheme="gray" 
                onClick={() => navigate(-1)} 
                mt={4}
                width="45%"
            >
                Back
            </Button>
            <Tooltip label='Save' isDisabled={isDisabled}>
                <Button 
                colorScheme="blue" 
                onClick={handleSave} 
                mt={5}
                width="45%"
                >
                Save Settings
                </Button>
            </Tooltip>  
        </Flex>
        </Flex>
    );
};

export default Settings;
