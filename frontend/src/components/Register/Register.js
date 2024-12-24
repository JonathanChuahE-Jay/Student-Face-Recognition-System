import {
    // useSteps,
    Box,
    Stepper,
    Button,
    Container,
    FormControl,
    FormLabel,
    Input,
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Avatar,
    Flex,
    AvatarBadge,
    InputGroup,
    InputRightElement,
    PinInput,
    PinInputField,
    HStack,
    useToast
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { EditIcon } from "@chakra-ui/icons";
import React, { useState } from "react";
import emailjs from "@emailjs/browser";

const Register = () => {
    const [generatedPin, setGeneratedPin] = useState('');
    const [enteredPin, setEnteredPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();
    const toast = useToast();

    const steps = [
        { title: 'First', description: 'Information' },
        { title: 'Second', description: 'Verification' },
        { title: 'Third', description: 'Complete' },
    ];

    // const { activeStep, setActiveStep } = useSteps({
    //     index: currentStep,
    //     count: steps.length,
    // });

    const handleShowPassword = () => setShow(!show);

    const handleEnteredPin = (e) => {
        setEnteredPin(e);
    }

    const handleUsername = (e) => {
        setUsername(e.target.value);
    };
    const handleEmail = (e) => {
        setEmail(e.target.value);
    };
    const handlePassword = (e) => {
        setPassword(e.target.value);
    };
    const handleProfilePicture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNextPage = () => {
        setCurrentStep(prev => prev + 1);
    };

    const handlePreviousPage = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleEmailVerification = () => {
        setIsLoading(true);

        fetch("http://localhost:5000/existing-email", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
            .then(response => response.json())
            .then(data => {
                if (data === 'Email already exists') {
                    toast({
                        title: 'Error',
                        position: 'top-right',
                        description: 'Email already exists',
                        status: 'error',
                        duration: 1000,
                        isClosable: true,
                    });
                    setIsLoading(false);
                } else {
                    const code = Math.floor(1000 + Math.random() * 9000).toString();
                    setGeneratedPin(code);

                    const templateParams = {
                        email_from: email,
                        code: code,
                    };

                    emailjs.send('service_x26hy6f', 'template_gx2dcde', templateParams, 'E81H8nhBjCZOjEuq3')
                        .then(() => {
                            toast({
                                title: 'Success',
                                position: 'top-right',
                                description: `A code has been sent to ${email}`,
                                status: 'success',
                                duration: 1000,
                                isClosable: true,
                            });
                            handleNextPage();
                        })
                        .catch(error => {
                            toast({
                                title: 'Error',
                                position: 'top-right',
                                description: `An error occurred: ${error.message}`,
                                status: 'error',
                                duration: 1000,
                                isClosable: true,
                            });
                        })
                        .finally(() => {
                            setIsLoading(false);
                        });
                }
            })
            .catch(error => {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: `An error occurred: ${error.message}`,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
                setIsLoading(false);
            });
    }

    const handleCorrectOTP = () => {
        setIsLoading(true);
        if (generatedPin === enteredPin) {
            fetch("http://localhost:5000/register", {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    profilePicture
                })
            })
                .then(() => {
                    toast({
                        title: 'Success',
                        position: 'top-right',
                        description: 'Successfully registered',
                        status: 'success',
                        duration: 1000,
                        isClosable: true,
                    });
                    handleNextPage();
                })
                .catch((error) => {
                    toast({
                        title: 'Error',
                        position: 'top-right',
                        description: `An error occurred: ${error.message}`,
                        status: 'error',
                        duration: 1000,
                        isClosable: true,
                    });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'Incorrect OTP entered. Please try again.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
            setIsLoading(false);
        }
    }

    if (currentStep === 0) {
        navigate('/login');
    }

    return (
        <Container boxShadow='dark-lg'  borderRadius={"20px"} marginTop={"20px"} padding={"20px"}>
            <Stepper index={currentStep}>
                {steps.map((step, index) => (
                    <Step key={index}>
                        <StepIndicator>
                            <StepStatus
                                complete={<StepIcon />}
                                incomplete={<StepNumber />}
                                active={<StepNumber />}
                            />
                        </StepIndicator>

                        <Box flexShrink='0'>
                            <StepTitle>{step.title}</StepTitle>
                            <StepDescription>{step.description}</StepDescription>
                        </Box>

                        <StepSeparator />
                    </Step>
                ))}
            </Stepper>
            {currentStep === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); handleEmailVerification(); }}>
                    <FormControl marginTop='50px'>
                        <Flex justifyContent={'center'}>
                            <Avatar size='2xl' src={profilePicture || 'https://bit.ly/broken-link'}>
                                <AvatarBadge bg={'white'} boxSize='1.1em' border="none">
                                    <label htmlFor="profilePictureInput" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                        <EditIcon boxSize="0.6em" color={'black'} />
                                    </label>
                                    <Input
                                        name="profilePicture"
                                        id="profilePictureInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePicture}
                                        style={{ display: "none" }}
                                    />
                                </AvatarBadge>
                            </Avatar>
                        </Flex>
                        <FormLabel marginTop='20px'>Username</FormLabel>
                        <Input type="text" required placeholder="Enter username" name="username" value={username} onChange={handleUsername} />
                        <FormLabel marginTop='20px'>Email</FormLabel>
                        <Input type="email" required placeholder="Enter email" name="email" value={email} onChange={handleEmail} />
                        <FormLabel marginTop='20px'>Password</FormLabel>
                        <InputGroup size='md'>
                            <Input
                                name="password"
                                pr='4.5rem'
                                type={show ? 'text' : 'password'}
                                placeholder='Enter password'
                                value={password}
                                onChange={handlePassword}
                                required
                            />
                            <InputRightElement width='4.5rem'>
                                <Button h='1.75rem' size='sm' onClick={handleShowPassword}>
                                    {show ? 'Hide' : 'Show'}
                                </Button>
                            </InputRightElement>
                        </InputGroup>
                        <Flex justifyContent={'space-between'}>
                            <Button width={'30%'} marginTop={'20px'} onClick={handlePreviousPage} isDisabled={currentStep === 0}>Back</Button>
                            <Button width={'30%'} marginTop={'20px'} type="submit" isLoading={isLoading}>Next</Button>
                        </Flex>
                    </FormControl>
                </form>
            )}
            {currentStep === 2 && (
                <FormControl>
                    <FormLabel marginTop={'20px'}>Email: </FormLabel>
                    <Input type="email" value={email} disabled />
                    <FormLabel marginTop={'20px'}>OTP: </FormLabel>
                    <HStack>
                        <PinInput otp onChange={handleEnteredPin}>
                            <PinInputField />
                            <PinInputField />
                            <PinInputField />
                            <PinInputField />
                        </PinInput>
                    </HStack>

                    <Flex justifyContent={'space-between'}>
                        <Button width={'30%'} marginTop={'20px'} onClick={handlePreviousPage}>Back</Button>
                        <Button width={'30%'} marginTop={'20px'} onClick={handleCorrectOTP} isLoading={isLoading}>Next</Button>
                    </Flex>
                </FormControl>
            )}
            {currentStep === 3 && (
                <Flex alignItems="center" justifyContent="center" flexDirection="column">
                    <CheckIcon boxSize="50px" color="green.500" />
                    <Button onClick={() => { navigate('/login') }} marginTop="20px">Go back to login page</Button>
                </Flex>
            )}
        </Container>
    );
}

export default Register;
