import React, { useState, useEffect } from 'react';
import {
    Box, Button, Input, FormControl, FormLabel, VStack, Heading, useToast,
    Flex, Avatar, AvatarBadge, Collapse,
    InputGroup,
    InputRightElement,
    IconButton
} from '@chakra-ui/react';
import axios from 'axios';
import { EditIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import { useLocation, useNavigate } from 'react-router-dom';

const MyAccount = ({onRefresh}) => {
    const toast = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user;

    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
        current_id: '', 
        user_id: '',
        profile_picture: 'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg',
        name: '',
        email: '',
        role: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    useEffect(()=>{
        oldPassword.length>0 ? setShowPasswordFields(true) : setShowPasswordFields(false);
    })
    useEffect(() => {
        if (user) {
            fetchUserData();
        } else {
            navigate('/login');
        }
    }, [user]);

    const fetchUserData = async () => {
        try {
            const response = await axios.post(`/show-user`, { user });
            const fetchedUser = response.data;
            setUserData((prevState) => ({
                ...prevState,
                current_id: fetchedUser.current_id,
                user_id: fetchedUser.user_id,
                profile_picture: fetchedUser.profile_picture || userData.profile_picture,
                name: fetchedUser.name,
                email: fetchedUser.email,
                role: fetchedUser.role
            }));
        } catch (error) {
            console.error('Error fetching user data:', error);
            navigate('/login');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
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
                    setUserData((prevState) => ({
                        ...prevState,
                        profile_picture: reader.result,
                    }));
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to upload the profile picture.',
                    status: 'error',
                    duration: 1000,
                    position: 'top-right',
                    isClosable: true,
                });
            }
        }
    };

    const handleSubmit = async () => {
        if (oldPassword) {
            if (!newPassword || !confirmPassword) {
                toast({
                    title: 'Error',
                    description: 'New password and confirmation cannot be left empty if old password is provided.',
                    status: 'error',
                    position: 'top-right',
                    duration: 1000,
                    isClosable: true,
                });
                return;
            }
    
            if (newPassword !== confirmPassword) {
                toast({
                    title: 'Error',
                    description: 'New password and confirmation do not match.',
                    status: 'error',
                    position: 'top-right',
                    duration: 1000,
                    isClosable: true,
                });
                return;
            }
    
        }
        setLoading(true);
        try {
            const updatedData = {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                profile_picture: userData.profile_picture,
                user_id: userData.user_id,
                current_id: userData.current_id,
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            };
            await axios.post(`/update-profile`, updatedData);

            toast({
                title: 'Profile Updated',
                description: 'Your profile has been successfully updated.',
                status: 'success',
                position: 'top-right',
                duration: 1000,
                isClosable: true,
            });
            setConfirmPassword('');
            setNewPassword('');
            setOldPassword('');
            setShowPasswordFields(false);
        }catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: 'Error',
                description: `${error.response?.data?.message || error.message}`,
                status: 'error',
                position: 'top-right',
                duration: 1000, 
                isClosable: true,
            });
        }finally {
            onRefresh();
            setLoading(false);
        }
        
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <Box p={5} maxWidth="500px" mx="auto">
            <Heading mb={5}>My Account</Heading>

            <Flex justifyContent="center">
                <Avatar size="xl" src={userData.profile_picture}>
                    <AvatarBadge bg="white" boxSize="1.25em">
                        <label
                            htmlFor="profilePictureInput"
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <EditIcon boxSize="0.6em" color="black" />
                        </label>
                        <Input
                            id="profilePictureInput"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePicture}
                            style={{ display: 'none' }}
                        />
                    </AvatarBadge>
                </Avatar>
            </Flex>

            <VStack spacing={4} width="100%">
                <FormControl id="name" isRequired width="100%">
                    <FormLabel>Name</FormLabel>
                    <Input
                        name="name"
                        value={userData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                    />
                </FormControl>

                <FormControl id="current_id" isRequired width="100%">
                    <FormLabel>ID</FormLabel>
                    <Input
                        isDisabled={user.role !== 'admin'}
                        name="current_id"  
                        value={userData.current_id}  
                        onChange={handleInputChange}
                        placeholder="Enter your id"
                    />
                </FormControl>

                <FormControl id="email" isRequired width="100%">
                    <FormLabel>Email</FormLabel>
                    <Input
                        name="email"
                        value={userData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        type="email"
                    />
                </FormControl>

                <FormControl id="oldPassword" mt={4} width="100%">
                    <FormLabel>Old Password</FormLabel>
                    <InputGroup>
                        <Input
                            name="oldPassword"
                            value={oldPassword}
                            onChange={(e) => {
                                setOldPassword(e.target.value);
                            }}
                            placeholder="Enter old password"
                            type={showPassword ? 'text' : 'password'}
                        />
                        <InputRightElement>
                            <IconButton onClick={() => setShowPassword(!showPassword)} icon={showPassword ? <ViewOffIcon /> : <ViewIcon />} h='1.75rem' size='sm' />
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <Box width="100%">
                    <Collapse in={showPasswordFields} animateOpacity>
                        <FormControl id="newPassword" mt={4} width="100%">
                            <FormLabel>New Password</FormLabel>
                            <Input
                                name="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                type="password"
                            />
                        </FormControl>

                        <FormControl id="confirmPassword" mt={4} width="100%">
                            <FormLabel>Confirm New Password</FormLabel>
                            <Input
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                type="password"
                            />
                        </FormControl>
                    </Collapse>
                </Box>

                <Button
                    colorScheme="blue"
                    onClick={handleSubmit}
                    isLoading={loading}
                    width="100%"
                >
                    Save Changes
                </Button>
            </VStack>
        </Box>
    );
};

export default MyAccount;
