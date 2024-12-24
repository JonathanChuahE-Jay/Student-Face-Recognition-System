// AddNewLecturer.js
import React, { useState } from 'react';
import {
    Flex,
    FormControl,
    FormLabel,
    Input,
    Avatar,
    Button,
    AvatarBadge,
    useToast,
    Tooltip
} from '@chakra-ui/react';
import emailjs from "@emailjs/browser";
import { CheckIcon, EditIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';

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
    const toast = useToast();

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
                <Tooltip isDisabled={isDisabled} label='Create' fontSize='md'>
                    <Button colorScheme='teal' width="100%" marginTop={'10px'} type="submit">
                        <CheckIcon ml={1} mr={1}/>Create
                    </Button>
                </Tooltip>
            </FormControl>
        </Flex>
    );
};

export default AddNewLecturer;
