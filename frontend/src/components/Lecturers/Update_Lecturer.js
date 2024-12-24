import React, {useRef, useState } from 'react';
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
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    Tooltip,
    useBreakpointValue
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';

const UpdateLecturer = ({ onReset,isDisabled,onRefresh, lecturer, onClose }) => {
    const [lecturerData, setLecturerData] = useState({
        lecturerId: lecturer.lecturer_id || '',
        lecturerEmail: lecturer.email || '',
        lecturerName: lecturer.name || '',
        lecturerContactNumber: lecturer.contact_number|| '',
        lecturerProfilePicture: lecturer.profile_picture || null
    });

    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
    const toast = useToast();
    const Ref = useRef();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLecturerData(prevState => ({ ...prevState, [name]: value }));
    };

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
                reader.onloadend = () => setLecturerData(prevState => ({ ...prevState, lecturerProfilePicture: reader.result }));
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Failed to compress image',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!lecturerData.lecturerName.trim()) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'Lecturer name is required',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        
        try {
            const response = await axios.post('http://localhost:5000/update-lecturer', {
                id: lecturer.id,
                contact_number: lecturerData.lecturerContactNumber,
                lecturer_id: lecturerData.lecturerId,
                name: lecturerData.lecturerName,
                profile_picture: lecturerData.lecturerProfilePicture,
                email: lecturerData.lecturerEmail
            });
    
            const data = response.data;
    
            if (data.error) {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: data.error,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: `${lecturerData.lecturerName} successfully updated`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onClose();
                onRefresh();
            }
        } catch (error) {
            console.error('Error updating lecturer:', error);
            const errorMessage = error.response?.data?.error || error.message;
            toast({
                title: 'Error',
                position: 'top-right',
                description: `${errorMessage}`,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };
    
    

    const handleDeleteLecturer = async () => {
        try {
            const response = await axios.delete('http://localhost:5000/delete-lecturer', {
                data: { id: lecturer.id }
            });
    
            const data = response.data;
    
            if (data.error) {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: data.error,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: `${lecturerData.lecturerName} successfully deleted`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onCloseDeleteModal();
                onClose();
                onRefresh();
            }
        } catch (error) {
            console.error('Error deleting lecturer:', error);
            const errorMessage = error.response?.data?.error || error.message;
            toast({
                title: 'Error',
                position: 'top-right',
                description: `An error occurred: ${errorMessage}`,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            onReset();
        }
    };
    
    
    // Determine the text or icon for the buttons based on screen size
    const deleteLabel = useBreakpointValue({ base: "", md: " Delete" });
    const updateLabel = useBreakpointValue({ base: "", md: " Update" });
    const backLabel = useBreakpointValue({ base: "", md: " Back" });

    return (
        <Flex alignItems="center" justifyContent="center">
            <FormControl as="form" padding="20px" borderRadius="20px" onSubmit={handleSubmit}>
                <Flex justifyContent="center">
                    <Avatar size="2xl" src={lecturerData.lecturerProfilePicture || 'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'}>
                        <AvatarBadge bg="white" boxSize="1.25em">
                            <label htmlFor="profilePictureInput" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                <EditIcon boxSize="0.6em" color="black" />
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
                <FormLabel marginTop="20px">Lecturer ID:</FormLabel>
                <Input
                    variant="flushed"
                    name="lecturerId"
                    value={lecturerData.lecturerId}
                    onChange={handleChange}
                    placeholder="Enter lecturer ID"
                />
                <FormLabel marginTop="20px">Lecturer Name:</FormLabel>
                <Input
                    variant="flushed"
                    name="lecturerName"
                    value={lecturerData.lecturerName}
                    onChange={handleChange}
                    placeholder="Enter lecturer name"
                />
                <FormLabel marginTop="20px">Lecturer Email:</FormLabel>
                <Input
                    variant="flushed"
                    name="lecturerEmail"
                    value={lecturerData.lecturerEmail}
                    onChange={handleChange}
                    placeholder="Enter lecturer email"
                />
                <FormLabel marginTop="20px">Lecturer Contact Number:</FormLabel>
                <Input
                    variant="flushed"
                    name="lecturerContactNumber"
                    value={lecturerData.lecturerContactNumber || ''}
                    onChange={handleChange}
                    placeholder="Enter lecturer contact number"
                />
                <Flex marginTop="20px" justifyContent="space-between">
                    <Tooltip isDisabled={isDisabled} label='Back' fontSize='md'>
                        <Button width='33%' textAlign="center" colorScheme='blue' onClick={onClose}>
                            <ArrowBackIcon ml={1} mr={1}/>{backLabel}
                        </Button>
                    </Tooltip>
                    <Tooltip isDisabled={isDisabled} label='Delete' fontSize='md'>
                        <Button width='33%' textAlign="center" colorScheme='red' onClick={onOpenDeleteModal}>
                            <DeleteIcon ml={1} mr={1}/>{deleteLabel}
                        </Button>
                    </Tooltip>
                    <Tooltip isDisabled={isDisabled} label='Update' fontSize='md'>
                        <Button width='33%' textAlign="center" colorScheme='teal' onClick={handleSubmit}>
                            <CheckIcon ml={1} mr={1}/>{updateLabel}
                        </Button>
                    </Tooltip>
                </Flex>
            </FormControl>

            <AlertDialog
                motionPreset='slideInBottom'
                leastDestructiveRef={Ref}
                onClose={onCloseDeleteModal}
                isOpen={isOpenDeleteModal}
                isCentered
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                <AlertDialogHeader>Delete confirmation</AlertDialogHeader>
                <Tooltip isDisabled={isDisabled} label='Close Dialog' fontSize='md'><AlertDialogCloseButton /></Tooltip>
                <AlertDialogBody>
                    Are you sure you want to delete {lecturer.name} ?
                </AlertDialogBody>
                <AlertDialogFooter>
                    <Button ref={Ref} onClick={onCloseDeleteModal}>
                    No
                    </Button>
                    <Button colorScheme='red' onClick={handleDeleteLecturer} ml={3}>
                    Yes
                    </Button>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Flex>
    );
};

export default UpdateLecturer;
