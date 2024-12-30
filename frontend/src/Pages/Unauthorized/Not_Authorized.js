import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Text, Flex, Spinner } from "@chakra-ui/react";

const NotAuthorized = ({ redirectPath }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(redirectPath || "/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, redirectPath]);

  return (
    <Flex direction="column" align="center" justify="center" h="100vh">
      <Box textAlign="center">
        <Text fontSize="2xl" fontWeight="bold" color="red.500">
          403 - Not Authorized
        </Text>
        <Text mt={4} fontSize="lg">
          You do not have permission to access this page.
        </Text>
        <Text mt={2} fontSize="md">
          Redirecting to your home page in 5 seconds...
        </Text>
        <Spinner mt={4} />
      </Box>
    </Flex>
  );
};

export default NotAuthorized;
