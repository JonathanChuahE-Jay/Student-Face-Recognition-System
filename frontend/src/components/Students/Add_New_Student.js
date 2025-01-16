import React, { useEffect, useRef, useState } from 'react';
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
    useDisclosure,
    Code,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Image,
    Text,
    Popover,
    PopoverTrigger,
    Box,
    ModalFooter,
    Divider,
    ModalCloseButton,
    Table,
    Tbody,
    Tr,
    Th,
    Td
} from '@chakra-ui/react';
import info from "../../Assets/Images/parse_json_student.png";
import emailjs from "@emailjs/browser";
import { AttachmentIcon, CheckIcon, EditIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import FaceCapture from '../FaceRecognition/Face_Capture';
import { FaQuestionCircle } from 'react-icons/fa';

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
    const [jsonContent, setJsonContent] = useState([]);
    const fileInputRef = useRef(null);
    const [passwordDisabled, setPasswordDisabled] = useState(false);
    
    const toast = useToast();

    const { isOpen: isOpenJsonModal, onOpen: onOpenJsonModal, onClose: onCloseJsonModal} = useDisclosure();
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

    const handleCheckBox = () => {
        setStudentID('');
        setIsAuto(!isAuto);
    }

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/register-student', {
                prefix: selectedOption,
                student_id: isAuto ? '' : studentID,
                name: studentName,
                email: studentEmail,
                password: passwordDisabled? "uni10pass!" : studentTempPass,
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

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                const parsedJson = JSON.parse(e.target.result);
                if (Array.isArray(parsedJson)) {
                    let isValid = true;
                    for (const student of parsedJson) {
                        if (
                            !student.prefix ||
                            !student.name ||
                            !student.email ||
                            !student.password ||
                            !student.facial_path ||
                            !student.programme ||
                            !student.currentIntakeSemester ||
                            !student.currentIntakeYear ||
                            !student.student_id ||
                            !student.profile_picture
                        ) {
                            isValid = false;
                            break;
                        }
                    }

                    if (isValid) {
                        setJsonContent(parsedJson);
                        toast({
                            title: "Success",
                            description: "JSON file parsed successfully.",
                            status: "success",
                            duration: 3000,
                            isClosable: true,
                        });
                        onOpenJsonModal();
                    }else {
                        toast({
                            title: "Invalid JSON Format",
                            description: "Each student must contain the required fields: prefix, name, email, password, facial_path, programme, currentIntakeSemester, currentIntakeYear, profile_picture, student_id",
                            status: "error",
                            duration: 3000,
                            isClosable: true,
                        });
                    }
                } else {
                    toast({
                        title: "Invalid JSON Format",
                        description: "The JSON must be an array.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    });
                }
                } catch (error) {
                toast({
                    title: "Error Parsing JSON",
                    description: "Invalid JSON file.",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                }
            };
            reader.readAsText(file);
            } else {
            toast({
                title: "Invalid File Type",
                description: "Please upload a valid JSON file.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const jsonInfo = `[
        {\n
            "prefix": "SW",\n
            "name": "Jack Lim",\n
            "email": "jacklim@gmail.com",\n
            "password": "uni10pass!",\n
            "facial_path": "path/to/facial/image",\n
            "programme": "Bachelor",\n
            "currentIntakeSemester": 1,\n
            "currentIntakeYear": 1,\n
            "student_id": "20932131",\n
            "profile_picture": "https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg"\n
        }\n
    ]
    `;

    const onStudentsCreated = async () => {
        for (const student of jsonContent) {
            const {
                prefix, name, email, password, facial_path, programme, currentIntakeSemester, currentIntakeYear, profile_picture, student_id
            } = student;
    
            try {
                const response = await axios.post('http://localhost:5000/register-student', {
                    prefix, name, email, password, facial_path, programme, currentIntakeSemester, currentIntakeYear, profile_picture, student_id
                });
    
                if (response.status === 201) {
                    toast({
                        title: 'Success',
                        position: 'top-right',
                        description: `Student ${name} successfully registered`,
                        status: 'success',
                        duration: 1000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: 'Error',
                        position: 'top-right',
                        description: response.data.error || `Error registering subject ${name}`,
                        status: 'error',
                        duration: 1000,
                        isClosable: true,
                    });
                }
            } catch (error) {
                const errorMessage = error.response?.data?.error || error.message;
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: `Error registering subject ${name}: ${errorMessage}`,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        }
        onRefresh();
        onClose();
    };

    const handlePasswordCheckBox = () => {
        setStudentTempPass("");
        setPasswordDisabled(!passwordDisabled);
    }
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
            <Flex marginTop='5px' paddingRight="20px" justifyContent="space-between">
                <FormLabel>Student ID:</FormLabel>
                <FormLabel>Auto</FormLabel>
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
            <Flex justifyContent='space-between' marginTop={'5px'}>
                <FormLabel>Temporary Password:</FormLabel>
                <FormLabel ml="20px">Default</FormLabel>
            </Flex>
            <Flex>
                <Input
                    cursor={passwordDisabled? "not-allowed":""}
                    readOnly={passwordDisabled}
                    required
                    variant="flushed"
                    name="temp_password"
                    type="password"
                    placeholder="Enter temporary password"
                    value={studentTempPass}
                    onChange={(e)=>setStudentTempPass(e.target.value)}
                />
                <Flex justifyContent='center' width='15%' alignItems='center' marginLeft='auto'>
                    <Checkbox isChecked={passwordDisabled} onChange={handlePasswordCheckBox}/>
                </Flex>
            </Flex>
            
            <Flex mt={4} width="100%" justifyContent='space-between'>
                <Tooltip isDisabled={isDisabled} label="Parse JSON" fontSize="md">
                    <Button
                        width="35%"
                        colorScheme="blue"
                        onClick={() => fileInputRef.current.click()}
                        position="relative"
                    >
                    <AttachmentIcon ml={1} mr={1} />
                    Parse JSON
                    </Button>
                </Tooltip>
                <Popover placement="top-end">
                    <PopoverTrigger>
                    <Box
                        position="absolute"
                        bottom="45px"
                        left="250px"
                        display="inline-block"
                        cursor="pointer"
                    >
                        <FaQuestionCircle fontSize="12px"/>
                    </Box>
                    </PopoverTrigger>
                    <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>What is Parse JSON?</PopoverHeader>
                    <PopoverBody
                        textAlign="left"
                        maxHeight="400px"
                        overflowY="auto"
                        padding="16px"
                        userSelect="text"
                    >
                        <Image src={info} alt="Info Image" mb={4} />
                        <Text mb={4} color="black" fontSize="sm">
                        Parsing JSON refers to the process of converting a JSON (JavaScript Object Notation) string into a JavaScript object that can be used in your code. It's like decoding the JSON data so that it can be accessed and manipulated by your program.
                        </Text>
                        <Text fontWeight="bold" mb={2} color="black">
                        Example:
                        </Text>
                        <Code
                            color="black"
                            fontSize="0.5rem"
                            borderRadius="5px"
                            padding="10px"
                            backgroundColor="f8f9fa"
                            whiteSpace="pre-wrap"
                            overflowX="auto"
                        >
                        {jsonInfo}
                        </Code>
                    </PopoverBody>
                    </PopoverContent>
                </Popover>
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                />
                <Tooltip isDisabled={isDisabled} label='Create' fontSize='md'>
                    <Button type="submit" colorScheme='teal' width="35%">
                        <CheckIcon ml={1} mr={1}/>
                        Create
                    </Button>
                </Tooltip>
            </Flex>
            <Modal closeOnOverlayClick={false} size='2xl' isOpen={isOpenFaceCapture} onClose={onCloseFaceCapture}>
            <ModalOverlay />
            <ModalContent marginTop='20px'>
                <ModalHeader>Face Capture</ModalHeader>
                <ModalBody padding='20px'>
                    <FaceCapture onClose={onClose} createdUser={createdUser}/>
                </ModalBody>
            </ModalContent>
            </Modal>
            <Modal isOpen={isOpenJsonModal} onClose={onCloseJsonModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Parsed Students</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {jsonContent.map((json, index) => (
                            <Box key={index} mb={4}>
                            <Flex justifyContent="center">
                                <Avatar
                                    mb={3}
                                    size="lg"
                                    src={
                                        json.profile_picture ||
                                        'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'
                                    }
                                />
                            </Flex>
                            <Divider mb={2} />
                            <Table size="sm" variant="striped" colorScheme="gray">
                                <Tbody>
                                    {[
                                        { label: 'Name', value: json.name },
                                        { label: 'Email', value: json.email },
                                        { label: 'Prefix', value: json.prefix },
                                        { label: 'Programme', value: json.programme },
                                        { label: 'Student ID', value: json.student_id },
                                        { label: 'Password', value: json.password },
                                        { label: 'Current Intake Semester', value: json.currentIntakeSemester },
                                        { label: 'Current Intake Year', value: json.currentIntakeYear },
                                    ].map((field, fieldIndex) => (
                                        <Tr key={fieldIndex}>
                                            <Th padding='3px' fontSize="10px" fontWeight="bold" textAlign="left" width="40%">
                                                {field.label}
                                            </Th>
                                            <Td padding='3px' fontSize="10px" textAlign="left">
                                                {field.value}
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                        
                        ))}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onCloseJsonModal}>
                            Close
                        </Button>
                        <Button variant="ghost" onClick={onStudentsCreated}>
                            Submit
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </FormControl>
    );
};

export default AddNewStudent;
