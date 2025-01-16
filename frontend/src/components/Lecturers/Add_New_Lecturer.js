import React, { useRef, useState } from 'react';
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
    useDisclosure,
    Popover,
    PopoverTrigger,
    Box,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Image,
    Text,
    Code,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Divider,
    Table,
    Tbody,
    Tr,
    Th,
    Td,
    ModalFooter
} from '@chakra-ui/react';
import emailjs from "@emailjs/browser";
import info from "../../Assets/Images/parse_json_lecturer.png";
import { AttachmentIcon, CheckIcon, EditIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { FaQuestionCircle } from 'react-icons/fa';

const defaultAvatarUrl = 'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg';

const AddNewLecturer = ({ isDisabled, onClose, onRefresh }) => {
    const [lecturer, setLecturer] = useState({
        contact_number: '',
        lecturerId: '',
        lecturerName: '',
        lecturerEmail: '',
        lecturerTempPass: '',
        lecturerPicture: null,
    });
    const [jsonContent, setJsonContent] = useState([]);
    const fileInputRef = useRef(null);
    const toast = useToast();

    const { isOpen: isOpenJsonModal, onOpen: onOpenJsonModal, onClose: onCloseJsonModal} = useDisclosure();

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                const parsedJson = JSON.parse(e.target.result);
                if (Array.isArray(parsedJson)) {
                    let isValid = true;
                    for (const lecturer of parsedJson) {
                        if (
                            !lecturer.lecturer_id ||
                            !lecturer.name ||
                            !lecturer.email ||
                            !lecturer.password ||
                            !lecturer.contact_number ||
                            !lecturer.profile_picture
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
                            description: "Each lecturer must contain the required fields: name, email, password, lecturer_id, profile_picture, contact_number",
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

    const jsonInfo = `
    [\n
        {\n
            "name": "Adam ong",\n
            "email": "adam@gmail.com",\n
            "password": "uni10pass!",\n
            "contact_number": "019232123!",\n
            "lecturer_id": "10231231",\n
            "profile_picture": "https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg"\n
        }\n
    ]\n
    `;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLecturer({ ...lecturer, [name]: value });
    };

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
        return phoneRegex.test(phone);
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
                    setLecturer({ ...lecturer, lecturerPicture: reader.result });
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Failed to upload profile picture',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validatePhoneNumber(lecturer.contact_number)) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'Invalid phone number format',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        axios.post('http://localhost:5000/register-lecturer', {
            lecturer_id: lecturer.lecturerId,
            name: lecturer.lecturerName,
            email: lecturer.lecturerEmail,
            password: lecturer.lecturerTempPass,
            contact_number: lecturer.contact_number,
            profile_picture: lecturer.lecturerPicture,
            joined_date: new Date().toISOString(),
        })
        .then((response) => {
            const data = response.data;
            if (data.message === 'User registered successfully') {
                const templateParams = {
                    email_from: lecturer.lecturerEmail,
                    code: lecturer.lecturerTempPass,
                }
                emailjs.send('service_x26hy6f', 'template_gx2dcde', templateParams, 'E81H8nhBjCZOjEuq3')
                    .then((result) => {
                        toast({
                            title: 'Success',
                            position: 'top-right',
                            description: `${lecturer.lecturerName} registered successfully  an email has been sent to their personal email.`,
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
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: `Lecturer ${lecturer.lecturerName} registered successfully`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                setLecturer({
                    lecturerId: '',
                    lecturerName: '',
                    lecturerEmail: '',
                    lecturerTempPass: '',
                    lecturerPicture: null,
                    contact_number: '',
                });
                onClose();
                onRefresh();
            } else {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: data.message || 'Failed to register lecturer',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        })
        .catch((error) => {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to register lecturer';
    
            console.error('Registration error:', errorMessage);
            toast({
                title: 'Error',
                position: 'top-right',
                description: `${errorMessage}`,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        });
    }
    const onLecturerCreated = async () => {
        for (const lecturer of jsonContent) {
            const {
                name, email, password, contact_number, profile_picture, lecturer_id
            } = lecturer;
    
            try {
                const response = await axios.post('http://localhost:5000/register-lecturer', {
                    name,
                    email,
                    password,
                    contact_number,
                    profile_picture,
                    lecturer_id,
                });
    
                if (response.status === 201) {
                    toast({
                        title: 'Success',
                        position: 'top-right',
                        description: `Lecturer ${name} successfully registered`,
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: 'Error',
                        position: 'top-right',
                        description: response.data.message || `Error registering lecturer ${name}`,
                        status: 'error',
                        duration: 2000,
                        isClosable: true,
                    });
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: `Error registering lecturer ${name}: ${error.response?.data?.message || error.message}`,
                    status: 'error',
                    duration: 2000,
                    isClosable: true,
                });
            }
        }
    
        onRefresh();
        onClose();
    };
    
    return (
        <Flex alignItems="center" justifyContent="center">
            <FormControl as="form" padding="10px" borderRadius="20px" onSubmit={handleSubmit}>
                <Flex justifyContent="center">
                    <Avatar
                        size="xl"
                        src={lecturer.lecturerPicture || defaultAvatarUrl}
                    >
                        <AvatarBadge bg="white" boxSize="1.25em">
                            <label
                                htmlFor="profilePictureInput"
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <EditIcon boxSize="0.6em" color="black" />
                            </label>
                            <Input
                                name="lecturerPicture"
                                id="profilePictureInput"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicture}
                                style={{ display: 'none' }}
                            />
                        </AvatarBadge>
                    </Avatar>
                </Flex>
                <FormLabel marginTop="10px">Lecturer ID:</FormLabel>
                <Input
                    required
                    variant="flushed"
                    name="lecturerId"
                    placeholder="Enter Lecturer ID"
                    value={lecturer.lecturerId}
                    onChange={handleChange}
                />
                <FormLabel marginTop="10px">Lecturer Name:</FormLabel>
                <Input
                    required
                    variant="flushed"
                    name="lecturerName"
                    placeholder="Enter Lecturer name"
                    value={lecturer.lecturerName}
                    onChange={handleChange}
                />
                <FormLabel marginTop="10px">Lecturer Email:</FormLabel>
                <Input
                    required
                    variant="flushed"
                    name="lecturerEmail"
                    placeholder="Enter Lecturer email"
                    value={lecturer.lecturerEmail}
                    onChange={handleChange}
                />
                <FormLabel marginTop="10px">Lecturer Contact Number:</FormLabel>
                <Input
                    required
                    variant="flushed"
                    type="text"
                    name="contact_number"
                    value={lecturer.contact_number}
                    onChange={handleChange}
                    placeholder="Contact Number"
                />
                <FormLabel marginTop="10px">Temporary Password:</FormLabel>
                <Input
                    required
                    variant="flushed"
                    name="lecturerTempPass"
                    type="password"
                    placeholder="Enter temporary password"
                    value={lecturer.lecturerTempPass}
                    onChange={handleChange}
                />
                
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
                            left="150px"
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
                        <Button colorScheme='teal' width="35%" type="submit">
                            <CheckIcon ml={1} mr={1}/>Create
                        </Button>
                    </Tooltip>
                </Flex>
            </FormControl>
            <Modal isOpen={isOpenJsonModal} onClose={onCloseJsonModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Parsed Lecturers</ModalHeader>
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
                                        { label: 'Lecturer ID', value: json.lecturer_id },
                                        { label: 'Password', value: json.password },
                                        { label: 'Contact Number', value: json.contact_number },
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
                        <Button variant="ghost" onClick={onLecturerCreated}>
                            Submit
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    );
};

export default AddNewLecturer;
