import React from "react";
import { Flex, useColorModeValue, Divider, Text, Box, Image } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import logo from "../../Assets/Gif/wolf.gif";

const SideNavigation = ({ links, role }) => {
    const linkColor = useColorModeValue('white', 'white');
    const linkHoverColor = useColorModeValue('gray.600', 'gray.500');
    const bgColor = useColorModeValue('gray.800', 'black');
    return (
        <Flex
            zIndex={2}
            direction="column"
            position="fixed"
            top="0"
            bottom="0"
            padding='9px'
            left="0"
            overflowY="auto"
            bg={bgColor}
            width="60px"
            transition="width 0.3s"
            _hover={{ width: "200px" }} 
        >
            <Box mb={4} display="flex" justifyContent="center" alignItems="center" height="60px" width="100%">
                <Image src={logo} alt={`${role} Logo`} height="52px" width="auto" objectFit="contain" />
            </Box>
            <Divider />
            <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
                {links.map((link, index) => (
                    <NavLink key={index} to={link.path}>
                        <Box
                            display="flex"
                            alignItems="center"
                            padding="20px 13px"
                            borderRadius="md"
                            _hover={{ bg: linkHoverColor }}
                            color={linkColor}
                            position="relative"
                        >
                            {link.icon}
                            <Text
                                ml={5}
                                display={{ base: "none", md: "flex" }}
                                alignItems="center"
                                position="absolute"
                                left="10"
                            >
                                {link.label}
                            </Text>
                        </Box>
                        <Divider />
                    </NavLink>
                ))}
            </Box>
        </Flex>
    );
};

export default SideNavigation;
