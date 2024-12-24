import React, { useEffect, useState } from 'react';
import {
    Flex,
    FormControl,
    FormLabel,
    Input,
    Avatar,
    Button,
    AvatarBadge,
    useToast,
    Tooltip,
    Select,
    Checkbox,
    FormHelperText,
    NumberInput,
    NumberInputField,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure
} from '@chakra-ui/react';
import emailjs from "@emailjs/browser";
import { CheckIcon, EditIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import FaceCapture from '../FaceRecognition/Face_Capture';

const AddNewStudent = ({ isDisabled, onClose, onRefresh }) => {
    const [studentID, setStudentID] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentTempPass, setStudentTempPass] = useState('');
    const [studentPicture, setStudentPicture] = useState(null);
    const [selectedOption, setSelectedOption] = useState("");
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [programme, setProgramme] =useState('');
    const [courses,setCourses]= useState([]);
    const [isAuto, setIsAuto] = useState(true);
    const [totalCurrentIntakeYear, setTotalCurrentIntakeYear] = useState('');
    const [totalCurrentIntakeSemester, setTotalCurrentIntakeSemester] = useState('');
    const [currentIntakeYear, setCurrentIntakeYear]= useState('');
    const [currentIntakeSemester, setCurrentIntakeSemester]= useState('');
    const [createdUser, setCreatedUser] = useState([]);
    
    const toast = useToast();

    const {isOpen: isOpenFaceCapture, onOpen: onOpenFaceCapture, onClose: onCloseFaceCapture} = useDisclosure();
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

    // Handle input changes
    const handleCheckBox = () => {
        setStudentID('');
        setIsAuto(!isAuto);
    }

    // Handle profile picture upload and compression
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
                    setStudentPicture(reader.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
            }
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/register-student', {
                prefix: selectedOption,
                student_id: isAuto ? '' : studentID,
                name: studentName,
                email: studentEmail,
                password: studentTempPass,
                profile_picture: studentPicture,
                programme,
                facial_path: '',
                currentIntakeSemester,
                currentIntakeYear
            });
    
            const data = response.data;

            if (data.message === 'User registered successfully') {
                const templateParams = {
                    email_from: studentEmail,
                    code: studentTempPass,
                }
                emailjs.send('service_x26hy6f', 'template_gx2dcde', templateParams, 'E81H8nhBjCZOjEuq3')
                    .then((result) => {
                        toast({
                            title: 'Success',
                            position: 'top-right',
                            description: `${studentName} registered successfully  an email has been sent to their personal email.`,
                            status: 'success',
                            duration: 1000,
                            isClosable: true,
                        });
                    }, (error) => {
                        toast({
                            title: 'Error',
                            position: 'top-right',
                            description: data.message || 'An error occurred. Please try again.',
                            status: 'error',
                            duration: 1000,
                            isClosable: true,
                        });
                    }
                );
                setCreatedUser(data.user);
                // Reset form fields
                setStudentID('');
                setStudentName('');
                setStudentEmail('');
                setStudentTempPass('');
                setStudentPicture(null);
                setProgramme('');
                onRefresh();
                onOpenFaceCapture();
            } else {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: data.message || 'An error occurred. Please try again.',
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'An error occurred. Please try again.';
            toast({
                position: 'top-right',
                title: 'Error',
                description: errorMessage,
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        if (selectedOption) {
            const course = courses.find(course => course.course_code === selectedOption);
            if (course) {
                setTotalCurrentIntakeYear(course.course_years);
                setTotalCurrentIntakeSemester(course.course_semesters);
                setProgramme(course.course_programme);
            } else {
                setProgramme('');
                setTotalCurrentIntakeYear('');
                setTotalCurrentIntakeSemester('');
            }
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

    return (
        <FormControl as="form" padding='5px' borderRadius='20px' onSubmit={handleSubmit}>
            <Flex justifyContent={'center'}>
                <Avatar
                    size="xl"
                    src={
                        studentPicture ||
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
            
            <FormLabel marginTop='5px'>Programme:</FormLabel>
            <Select value={programme} onChange={(e)=>{setProgramme(e.target.value)}} required>
                <option value=''>Select a programme</option>
                <option value='Foundation'>Foundation</option>
                <option value='Bachelor'>Bachelor</option>
                <option value='Diploma'>Diploma</option>
                <option value='Master'>Master</option>
                <option value='Phd'>Phd</option>
            </Select>
            <Flex marginTop='5px'>
                <FormLabel>Student ID:</FormLabel>
                <FormLabel marginLeft='auto'>Auto</FormLabel>
            </Flex>
            <Flex>
                <Select onChange={(e) => setSelectedOption(e.target.value)}  required width='85%'>
                    <option value="">Select a course</option>
                    {filteredCourses.map((course, index) => (
                        <option key={index} value={course.course_code}>
                            {course.course_code} ({course.course_name})
                        </option>
                    ))}
                </Select>
                <Flex justifyContent='center' width='15%' alignItems='center' marginLeft='auto'>
                    <Checkbox isChecked={isAuto} onChange={handleCheckBox}/>
                </Flex>
            </Flex>
            {
                !isAuto && (
                    <Flex marginTop='5px' flexDirection="column">
                        <Flex>
                            <Input 
                                width='17%' 
                                marginRight='5px' 
                                value={selectedOption} 
                                disabled 
                            />
                            <NumberInput 
                                width='83%'
                                variant="flushed"
                            >
                                <NumberInputField 
                                    minLength={8}
                                    maxLength={9}
                                    required
                                    name="student_id"
                                    placeholder="Enter student ID"
                                    value={studentID}
                                    onChange={(e) => setStudentID(e.target.value)}
                                />
                            </NumberInput>
                        </Flex>
                        {studentID.length > 0 && studentID.length < 8 && (
                            <FormHelperText color='red'>Please enter at least 8 digits</FormHelperText>
                        )}
                    </Flex>
                )
            }
            <FormLabel marginTop="5px">Current Intake:</FormLabel>
            <Flex justifyContent="space-between">
                <Select
                    width="47%"
                    value={currentIntakeYear}
                    onChange={(e) => setCurrentIntakeYear(e.target.value)}
                    required
                >
                    <option value="">Intake Year</option>
                    {Array.from({ length: totalCurrentIntakeYear }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                            {index + 1}
                        </option>
                    ))}
                </Select>

                <Select
                    width="47%"
                    value={currentIntakeSemester}
                    onChange={(e) => setCurrentIntakeSemester(e.target.value)}
                    required
                >
                    <option value="">Intake Semester</option>
                    {Array.from({ length: totalCurrentIntakeSemester }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                            {index + 1}
                        </option>
                    ))}
                </Select>
            </Flex>

            <FormLabel marginTop='5px'>Student Name:</FormLabel>
            <Input
                required
                variant="flushed"
                name="name"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e)=>setStudentName(e.target.value)}
            />

            <FormLabel marginTop={'5px'}>Student Email:</FormLabel>
            <Input
                required
                variant="flushed"
                name="email"
                placeholder="Enter student email"
                value={studentEmail}
                onChange={(e)=>setStudentEmail(e.target.value)}
            />

            <FormLabel marginTop={'5px'}>Temporary Password:</FormLabel>
            <Input
                required
                variant="flushed"
                name="temp_password"
                type="password"
                placeholder="Enter temporary password"
                value={studentTempPass}
                onChange={(e)=>setStudentTempPass(e.target.value)}
            />
            <Tooltip isDisabled={isDisabled} label='Create' fontSize='md'>
                <Button type="submit" mt='8px' width='full' colorScheme='teal'>
                    <CheckIcon ml={1} mr={1}/>
                    Create
                </Button>
            </Tooltip>
            <Modal closeOnOverlayClick={false} size='2xl' isOpen={isOpenFaceCapture} onClose={onCloseFaceCapture}>
            <ModalOverlay />
            <ModalContent marginTop='20px'>
                <ModalHeader>Face Capture</ModalHeader>
                <ModalBody padding='20px'>
                    <FaceCapture onClose={onClose} createdUser={createdUser}/>
                </ModalBody>
            </ModalContent>
            </Modal>
        </FormControl>
    );
};

export default AddNewStudent;
