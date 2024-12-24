import React, { useState } from 'react';
import emailjs from "@emailjs/browser";
import { Box, HStack, PinInput, PinInputField } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  FormControl,
  FormLabel,
  Stack,
  Center,
  useToast,
} from '@chakra-ui/react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [generatedPin, setGeneratedPin] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [emailDisabled, setEmailDisabled] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [correctPin, setCorrectPin] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const handleNewPassword = (event) => {
    setNewPassword(event.target.value);
  };

  const handleConfirmNewPassword = (event) => {
    setConfirmNewPassword(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };
  
  const handleEnteredPin = (value) => {
    setEnteredPin(value);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  }
  
  const handleBackToForgotPassword = () => {
    setShowPin(false);
    setEmailDisabled(false);
    navigate('/forgot-password');
    
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPin(resetCode);

    const templateParams = {
      email_from: email,
      reset_code: resetCode,
    };

    try {
      const response = await fetch('http://localhost:5000/valid-email', {
        method: "post",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const user = await response.json();

      if (user.email) {
        await emailjs.send('service_x26hy6f', 'template_v6lg1nj', templateParams, 'E81H8nhBjCZOjEuq3');
        setEmailDisabled(true);
        setShowPin(true);
        toast({
          title: 'Success',
          position: 'top-right',
          description: `A reset code has been sent to ${email}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          position: 'top-right',
          description: `The email is not registered in our system.`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        position: 'top-right',
        description: `An error occurred: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCorrectPassword = () => {
    setIsLoading(true);

    if (enteredPin === generatedPin) {
      toast({
        title: 'Success',
        position: 'top-right',
        description: 'Please enter a new password',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setCorrectPin(true);
    } else {
      toast({
        title: 'Error',
        position: 'top-right',
        description: 'Incorrect OTP entered. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword === confirmNewPassword) {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, newPassword }),
        });

        if (response.ok) {
          toast({
            title: 'Success',
            position: 'top-right',
            description: 'Password successfully reset.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          navigate('/login');
        } else {
          throw new Error('Failed to reset password');
        }
      } catch (error) {
        toast({
          title: 'Error',
          position: 'top-right',
          description: `An error occurred: ${error.message}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: 'Error',
        position: 'top-right',
        description: 'Passwords do not match.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Center height="90vh">
      <Stack
        height="50%"
        width="50%"
        padding="20px"
        borderRadius="20px"
        boxShadow="rgba(0, 0, 0, 0.35) 0px 5px 15px"
      >
        {/* Pin */}
        {correctPin ? (
          <form onSubmit={handlePasswordReset}>
            <FormControl>
              <FormLabel marginTop="20px">New Password:</FormLabel>
              <Input
                type="password"
                value={newPassword}
                onChange={handleNewPassword}
                required
              />
              <FormLabel marginTop="20px">Confirm Password:</FormLabel>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={handleConfirmNewPassword}
                required
              />
              <Button type="submit" marginTop="20px" isLoading={isLoading}>
                Reset Password
              </Button>
            </FormControl>
          </form>
        ) : (
          // Ask for email
          <form onSubmit={handleForgotPassword}>
            <FormControl>
              <FormLabel>Email:</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                isDisabled={emailDisabled}
              />
              
              {/* Show pin box */}
              {showPin && (
                <>
                  <FormLabel marginTop="20px">OTP:</FormLabel>
                  <HStack marginTop="5px">
                    <PinInput otp onChange={handleEnteredPin}>
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                  <Box display={"flex"} flexDirection={"column"} height={"100px"}>
                    <Box display="flex" justifyContent="space-between" marginTop="auto">
                      <Button marginTop="20px" width="40%" onClick={handleBackToForgotPassword} >Back</Button>
                      <Button marginTop="20px" onClick={handleCorrectPassword} isLoading={isLoading}>
                        Confirm OTP
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
                {/* Show pin reset button */}
              {!showPin && (
                <Box display={"flex"} flexDirection={"column"} height={"200px"}>
                  <Box display="flex" justifyContent="space-between" marginTop="auto">
                    <Button marginTop="20px" width="40%" onClick={handleBackToLogin}>Back</Button>
                    <Button type="submit" width="40%" marginTop="20px" isLoading={isLoading}>
                      Send Reset Code
                    </Button>
                  </Box>
                </Box>
              
              )}
            </FormControl>
          </form>
        )}
      </Stack>
    </Center>
  );
};

export default ForgotPassword;
