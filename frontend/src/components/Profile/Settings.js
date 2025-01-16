import React, { useState, useEffect } from "react";
import { 
    Box, 
    Heading, 
    Button, 
    useToast, 
    VStack, 
    Tooltip, 
    Flex, 
    useColorMode, 
    FormLabel
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ToolTip from "../ToolTips/ToolTip";
import ColorMode from "../ColorMode/Color_Mode";
import { useTooltip } from "../../Context/ToolTipContext";
import axios from "axios";

const Settings = ({ user }) => {
    const toast = useToast();
    const navigate = useNavigate();
    const { setIsDisabled, isDisabled } = useTooltip();
    const { colorMode, toggleColorMode } = useColorMode();

    const [isTooltipEnabled, setIsTooltipEnabled] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(colorMode === "dark");
    const [tempIsDarkMode, setTempIsDarkMode] = useState(colorMode === "dark");
    const [isLoadingNextSemester, setIsLoadingNextSemester] = useState(false);

    useEffect(() => {
        const storedTooltipSetting = localStorage.getItem("isTooltipEnabled");
        const storedDarkModeSetting = localStorage.getItem("isDarkMode");

        if (storedTooltipSetting !== null) {
            setIsTooltipEnabled(JSON.parse(storedTooltipSetting));
        }
        if (storedDarkModeSetting !== null) {
            setTempIsDarkMode(JSON.parse(storedDarkModeSetting));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("isTooltipEnabled", JSON.stringify(isTooltipEnabled));
        localStorage.setItem("isDarkMode", JSON.stringify(tempIsDarkMode));

        setIsDisabled(!isTooltipEnabled);

        if (tempIsDarkMode !== isDarkMode) {
            toggleColorMode();
            setIsDarkMode(tempIsDarkMode);
        }

        toast({
            title: "Settings saved.",
            description: "Your settings have been updated successfully.",
            status: "success",
            duration: 2000,
            isClosable: true,
        });
    };

    const handleNextSemester = async () => {
        setIsLoadingNextSemester(true);
        try {
            const response = await axios.get("/next-semester");
            const { message } = response.data;
            toast({
                title: "Success",
                description: message || "All students have been moved to the next semester.",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update to the next semester.",
                status: "error",
                duration: 2000,
                isClosable: true,
            });
        } finally {
            setIsLoadingNextSemester(false);
        }
    };

    return (
        <Flex p={5} height="90vh" flexDirection="column">
            <Heading mb={5}>Settings</Heading>

            <VStack spacing={4} align="stretch">
                <ToolTip 
                    isTooltipEnabled={isTooltipEnabled} 
                    setIsTooltipEnabled={setIsTooltipEnabled} 
                />
                <ColorMode 
                    isDarkMode={tempIsDarkMode} 
                    setIsDarkMode={setTempIsDarkMode} 
                />
            </VStack>
            
                {user.role === "admin" && (
                    <Box
                        mt='auto'
                        >
                        <FormLabel>Others:</FormLabel>
                        <Button 
                            colorScheme="teal" 
                            onClick={handleNextSemester} 
                            isLoading={isLoadingNextSemester} 
                        >
                            Move to Next Semester
                        </Button>
                    </Box>
                )}
            <Flex justifyContent="space-between" mt="auto">
                <Button 
                    colorScheme="gray" 
                    onClick={() => navigate(-1)} 
                    mt={4} 
                    width="45%"
                >
                    Back
                </Button>
                <Tooltip label="Save" isDisabled={isDisabled}>
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
