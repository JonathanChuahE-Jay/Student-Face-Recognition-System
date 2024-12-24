import React, { useEffect, useRef, useState } from 'react';
import {
    Flex,
    FormControl,
    FormLabel,
    Input,
    Avatar,
    AvatarBadge,
    Button,
    useToast,
    useDisclosure,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Tooltip,
    useBreakpointValue,
    Select,
    Text,
    Modal,
    ModalHeader,
    ModalOverlay,
    ModalCloseButton,
    ModalContent,
    ModalBody,
} from '@chakra-ui/react';
import { CheckIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { FaCamera } from "react-icons/fa";
import FaceCapture from '../FaceRecognition/Face_Capture';

const Update_Student = ({ isDisabled, onRefresh, student, onClose }) => {
    const [selectedOption, setSelectedOption] = useState("");
    const [studentId, setStudentId] = useState('');
    const [studentEmail, setStudentEmail] = useState(student.email || '');
    const [studentName, setStudentName] = useState(student.name || '');
    const [studentProfilePicture, setStudentProfilePicture] = useState(student.profile_picture || null);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [programme, setProgramme] =useState('');
    const [totalCurrentIntakeYear, setTotalCurrentIntakeYear] = useState('');
    const [totalCurrentIntakeSemester, setTotalCurrentIntakeSemester] = useState('');
    const [currentIntakeYear, setCurrentIntakeYear]= useState(student.current_year ||'');
    const [currentIntakeSemester, setCurrentIntakeSemester]= useState(student.current_semester||'');
    
    const { isOpen: isOpenFaceCaptureModal, onOpen: onOpenFaceCaptureModal, onClose: onCloseFaceCaptureModal } = useDisclosure();
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();

    const toast = useToast();
    const Ref = useRef();

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
    
    useEffect(() => {
        if (!student.prefix) {
            const alphabets = student.student_id.match(/[A-Za-z]+/)[0];
            const numbers = student.student_id.match(/\d+/)[0]; 
            setStudentId(numbers);
            setSelectedOption(alphabets);
        }else{
            setStudentId(student.student_id.replace(/[A-Za-z]/g, ''));
            setSelectedOption(student.prefix);
        }
    }, [student]);

    // Find programmes based on course code
    useEffect(() => {
        if (selectedOption) {
            const course = courses.find(course => course.course_code === selectedOption);
            if (course) {
                setTotalCurrentIntakeYear(course.course_years);
                setTotalCurrentIntakeSemester(course.course_semesters);
                setProgramme(course.course_programme);
            } else {
                setTotalCurrentIntakeYear('');
                setTotalCurrentIntakeSemester('');
                setProgramme('');
            }
        }
    }, [selectedOption, courses]);

    // Find course code based on programme
    useEffect(() => {
        if (programme) {
            const filtered = courses.filter(course => course.course_programme === programme);
            setFilteredCourses(filtered);
        } else {
            setFilteredCourses(courses);
        }
    }, [programme, courses]);
    

    const handleProfilePicture = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const options = {
                maxSizeMB: 0.1,
                maxWidthOrHeight: 200,
                useWebWorker: true
            };

            try {
                const compressedFile = await imageCompression(file, options);
                const reader = new FileReader();
                reader.onloadend = () => setStudentProfilePicture(reader.result);
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Failed to compress image',
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!studentName.trim()) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'Student name is required',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/update-student', {
                id: student.id,
                student_id: studentId,
                name: studentName,
                profile_picture: studentProfilePicture,
                email: studentEmail,
                prefix: selectedOption,
                programme,
                current_year: currentIntakeYear,
                current_semester: currentIntakeSemester
            });

            const { message, error } = response.data;
            
            if (error) {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: error,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            } else if (message) {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: message,
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });

                onRefresh();
                onClose();
            }
        } catch (error) {
            console.error('Error updating student:', error);
            toast({
                title: 'Error',
                position: 'top-right',
                description: `${error.response?.data?.error || error.message}`,
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };

    const handleDeleteStudent = async () => {
        try {
            const response = await axios.delete('http://localhost:5000/delete-student', {
                headers: { 'Content-Type': 'application/json' },
                data: { id: student.id }
            });

            const { message, error } = response.data;

            if (error) {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: error,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            } else if (message) {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: message,
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });
                onCloseDeleteModal();
                onClose();
                onRefresh();
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            toast({
                title: 'Error',
                position: 'top-right',
                description: `${error.response?.data?.error || error.message}`,
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };

    const deleteLabel = useBreakpointValue({ base: "", md: " Delete" });
    const updateLabel = useBreakpointValue({ base: "", md: " Update" });
    const faceCapture = useBreakpointValue({ base: "", md: " Face Capture" });

    return (
        <Flex alignItems="center" justifyContent="center">
            <FormControl as="form" padding="20px" borderRadius="20px" onSubmit={handleSubmit}>
                <Flex justifyContent="center">
                    <Avatar 
                        size="2xl" 
                        src={studentProfilePicture || 'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'}
                        alt="Student Profile Picture"
                    >
                        <AvatarBadge bg="white" boxSize="1.25em">
                            <label htmlFor="profilePictureInput" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                <EditIcon boxSize="0.6em" color="black" aria-label="Edit Profile Picture" />
                            </label>
                            <Input
                                name="profile_picture"
                                id="profilePictureInput"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicture}
                                style={{ display: "none" }}
                            />
                        </AvatarBadge>
                    </Avatar>
                </Flex>
                <FormLabel marginTop={'10px'}>Programme:</FormLabel>
                <Select value={programme} onChange={(e)=>{setProgramme(e.target.value)}} required>
                    <option value=''>Select a programme</option>
                    <option value='Foundation'>Foundation</option>
                    <option value='Bachelor'>Bachelor</option>
                    <option value='Diploma'>Diploma</option>
                    <option value='Master'>Master</option>
                    <option value='Phd'>Phd</option>
                </Select>
                <FormLabel marginTop="10px">Student ID:</FormLabel>
                <Flex>
                    <Select mr={3} onChange={(e) => setSelectedOption(e.target.value)} value={selectedOption} required width='70%'>
                        <option value="">Select a program</option>
                        {
                            filteredCourses.map((course, index) => (
                            <option key={index} value={course.course_code}>
                                {course.course_code} ({course.course_name})
                            </option>
                        ))}
                    </Select>
                    <Input
                        type='number'
                        variant="flushed"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Enter student ID"
                    />
                </Flex>
                <FormLabel marginTop="10px">Student Name:</FormLabel>
                <Input
                    variant="flushed"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name"
                />
                <FormLabel marginTop="10px">Student Email:</FormLabel>
                <Input
                    variant="flushed"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="Enter student email"
                />
                <FormLabel marginTop="10px">Current Intake:</FormLabel>
                <Flex justifyContent="space-between">
                    <Select
                        width="47%"
                        value={currentIntakeYear}
                        onChange={(e) => setCurrentIntakeYear(e.target.value)}
                        required
                    >
                        <option value="">Select a intake Year</option>
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
                        <option value="">Select a intake Semester</option>
                        {Array.from({ length: totalCurrentIntakeSemester }, (_, index) => (
                            <option key={index + 1} value={index + 1}>
                                {index + 1}
                            </option>
                        ))}
                    </Select>
                </Flex>
                <Flex marginTop="15px" justifyContent="space-between">
                    <Tooltip isDisabled={isDisabled} label='Face Capture' fontSize='md'>
                        <Button width='33%' textAlign="center" colorScheme='blue' onClick={onOpenFaceCaptureModal}>
                            <FaCamera/><Text ml={1} mr={1}>{faceCapture}</Text>
                        </Button>
                    </Tooltip>
                    <Tooltip isDisabled={isDisabled} label='Delete' fontSize='md'>
                        <Button width='33%' colorScheme="red" onClick={onOpenDeleteModal}>
                            <DeleteIcon ml={1} mr={1}/> {deleteLabel}
                        </Button>
                    </Tooltip>
                    <Tooltip isDisabled={isDisabled} label='Update' fontSize='md'>
                        <Button width='33%' colorScheme="teal" type="submit">
                            <CheckIcon ml={1} mr={1}/> {updateLabel}
                        </Button>
                    </Tooltip>
                </Flex>
            </FormControl>
            <Modal size='2xl' isOpen={isOpenFaceCaptureModal} onClose={onCloseFaceCaptureModal}>
                <ModalOverlay/>
                <ModalContent marginTop='20px'>
                    <ModalHeader>Face Capture</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody padding='20px'>
                        <FaceCapture onClose={onCloseFaceCaptureModal} createdUser={student}/>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <AlertDialog
                motionPreset='slideInBottom'
                leastDestructiveRef={Ref}
                onClose={onCloseDeleteModal}
                isOpen={isOpenDeleteModal}
                isCentered
            >
                <AlertDialogOverlay/>
                <AlertDialogContent>
                    <AlertDialogHeader>Delete confirmation</AlertDialogHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Dialog' fontSize='md'>
                        <AlertDialogCloseButton/>
                    </Tooltip>
                    <AlertDialogBody>
                        Are you sure you want to delete this {studentName}?
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={Ref} onClick={onCloseDeleteModal}>
                            No
                        </Button>
                        <Button colorScheme='red' onClick={handleDeleteStudent} ml={3}>
                            Yes
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Flex>
    );
};

export default Update_Student;
