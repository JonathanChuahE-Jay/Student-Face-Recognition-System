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
    useToast,
    Select
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { EditIcon } from "@chakra-ui/icons";
import React, { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import axios from 'axios';
import imageCompression from 'browser-image-compression';

const Register = () => {
    const [generatedPin, setGeneratedPin] = useState('');
    const [enteredPin, setEnteredPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [programme, setProgramme] = useState('');
    const [selectedOption, setSelectedOption] = useState("");
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [btnLock,setBtnLock]=useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();
    const toast = useToast();

    const steps = [
        { title: 'First', description: 'Information' },
        { title: 'Second', description: 'Verification' },
        { title: 'Third', description: 'More Information' },
        { title: 'Forth', description: 'Complete' },
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
    const handleProfilePicture = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const options = {
                    maxSizeMB: 0.1,
                    maxWidthOrHeight: 200,
                    useWebWorker: true,
                };
    
                try {
                    const compressedFile = await imageCompression(file, options);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setProfilePicture(reader.result);
                    };
                    reader.readAsDataURL(compressedFile);
                } catch (error) {
                    console.error('Error compressing image:', error);
                }
            }
        };
    

    const handleNextPage = () => {
        setCurrentStep(prev => prev + 1);
    };

    const handlePreviousPage = () => {
        setCurrentStep(prev => prev - 1);
    };

    useEffect(() => {
        axios.get('/show-all-courses')
            .then(response => {
                setCourses(response.data);
            })
            .catch(error => {
                console.error('Error fetching student courses:', error);
                toast({
                    title: "Error",
                    position: 'top-right',
                    description: "There was an error fetching the student courses.",
                    status: "error",
                    duration: 1000,
                    isClosable: true,
                });
            });
    }, []);

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

    useEffect(()=>{
        if(!programme || !selectedOption){
            setBtnLock(true);
        }else{
            setBtnLock(false);
        }
    },[programme,selectedOption])

    const handlePasswordValidation = () => {
        setIsLoading(true);
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!password.match(passwordRegex)) {
            toast({
                title: 'Password Error',
                position: 'top-right',
                description: 'Password must be at least 8 characters long, include a number and a special character.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
            setIsLoading(false);
            return false;
        }
        setIsLoading(false);
        handleEmailVerification();
    }

    const handleCorrectOTP = () => {
        setIsLoading(true);
        if (generatedPin === enteredPin) {
            toast({
                title: 'Success',
                position: 'top-right',
                description: 'Successfully validated',
                status: 'success',
                duration: 1000,
                isClosable: true,
            });
            handleNextPage();
        } else {
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'Incorrect OTP entered. Please try again.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
        setIsLoading(false);
    }
    useEffect(() => {
        if (selectedOption) {
            const course = courses.find(course => course.course_code === selectedOption);
            setProgramme(course ? course.course_programme : '');
        }
    }, [selectedOption, courses]);

    useEffect(() => {
        if (programme) {
            const filtered = courses.filter(course => course.course_programme === programme);
            setFilteredCourses(filtered);
        } else {
            setFilteredCourses(courses);
        }
    }, [programme, courses]);

    const handleMoreInformation = () => {
        setIsLoading(true);
        axios.post("http://localhost:5000/register", {
            username,
            email,
            password,
            profilePicture,
            prefix: selectedOption,
            programme
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
                description: error.response?.data?.error || 'An error occurred while assigning subjects.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        })
        .finally(() => {
            setIsLoading(false);
        });
    }

    if (currentStep === 0) {
        navigate('/login');
    }

    return (
        <Container 
            boxShadow='dark-lg' 
            borderRadius="20px" 
            marginTop="20px" 
            padding="20px" 
            maxW="1000px" 
            width="90%">
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
                <form onSubmit={(e) => { e.preventDefault(); handlePasswordValidation(); }}>
                    <FormControl marginTop='50px'>
                        <Flex justifyContent={'center'}>
                            <Avatar
                                size="2xl"
                                src={
                                    profilePicture ||
                                    'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'
                                }
                            >
                                <AvatarBadge bg={'white'} boxSize="1.25em">
                                    <label
                                        htmlFor="profilePictureInput"
                                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <EditIcon boxSize="0.6em" color={'black'} />
                                    </label>
                                    <Input
                                        name="profile_picture"
                                        id="profilePictureInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePicture}
                                        style={{ display: 'none' }}
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
                <FormControl mt={5} mb={5}>
                        <FormLabel marginTop='5px'>Programme:</FormLabel>
                        <Select value={programme} onChange={(e)=>{setProgramme(e.target.value)}} required>
                            <option value=''>Select a programme</option>
                            <option value='Foundation'>Foundation</option>
                            <option value='Bachelor'>Bachelor</option>
                            <option value='Diploma'>Diploma</option>
                            <option value='Master'>Master</option>
                            <option value='Phd'>Phd</option>
                        </Select>
                        <FormLabel marginTop='5px'>Course:</FormLabel>
                        <Select onChange={(e) => setSelectedOption(e.target.value)}  required>
                            <option value="">Select a course</option>
                            {filteredCourses.map((course, index) => (
                                <option key={index} value={course.course_code}>
                                    {course.course_code} ({course.course_name})
                                </option>
                            ))}
                        </Select>
                    <Flex justifyContent={'space-between'}>
                        <Button width={'30%'} marginTop={'20px'} onClick={handlePreviousPage}>Back</Button>
                        <Button width={'30%'} marginTop={'20px'} onClick={handleMoreInformation} isDisabled={btnLock} isLoading={isLoading}>Next</Button>
                    </Flex>
                </FormControl>
            )}
            {currentStep === 4 && (
                <Flex alignItems="center" justifyContent="center" flexDirection="column">
                    <CheckIcon boxSize="50px" color="green.500" />
                    <Button onClick={() => { navigate('/login') }} marginTop="20px">Go back to login page</Button>
                </Flex>
            )}
        </Container>
    );
}

export default Register;
