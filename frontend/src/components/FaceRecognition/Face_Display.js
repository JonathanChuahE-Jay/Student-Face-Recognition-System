import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, CloseButton, Flex, Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, Tooltip, useBreakpointValue, useDisclosure, useToast } from "@chakra-ui/react";
import React, { useState } from "react";
import FaceCapture from "./Face_Capture";
import { FaCamera } from "react-icons/fa";
import axios from "axios";
import { EditIcon } from "@chakra-ui/icons";

const FaceDisplay = ({ createdUser, isDisabled, onClose }) => {

    const { isOpen: isOpenFaceCaptureModal, onOpen: onOpenFaceCaptureModal, onClose: onCloseFaceCaptureModal } = useDisclosure();
    const { isOpen: isOpenPreviewAlert, onOpen: onOpenPreviewAlert, onClose: onClosePreviewAlert } = useDisclosure();

    const faceCapture = useBreakpointValue({ base: "", md: " Change" });
    const close = useBreakpointValue({ base: "", md: " Close" });
    const upload = useBreakpointValue({ base: "", md: " Upload Photo" });

    const imageUrl = `http://localhost:5000/uploads/${createdUser.facial_path}`;
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const toast = useToast();

    const saveImage = async () => {
        if (selectedFile) {
            const formData = new FormData();
            formData.append("image", selectedFile, `${createdUser.name}.jpg`);
            formData.append("user_id", createdUser.user_id);

            try {
                const response = await axios.post("http://localhost:5000/upload", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                toast({
                    position: "top-right",
                    title: "Success",
                    description: response.data.message || "Image uploaded successfully.",
                    status: "success",
                    duration: 1000,
                    isClosable: true,
                });
                onClosePreviewAlert()
            } catch (error) {
                const errorMessage =
                    error.response?.data?.error || error.message || "An error occurred. Please try again.";
                console.error("Error uploading image:", error);
                toast({
                    position: "top-right",
                    title: "Error",
                    description: errorMessage,
                    status: "error",
                    duration: 1000,
                    isClosable: true,
                });
            }
        }
        onClose();
    };
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onOpenPreviewAlert();
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    return (
        <Box textAlign="center" mt={4}>
            <Text fontSize="lg" fontWeight="bold">
                {createdUser.name}'s Current Facial Data
            </Text>
            <Image
                src={imageUrl}
                alt={`${createdUser.name}'s face`}
                boxSize="200px"
                objectFit="cover"
                borderRadius="full"
                mx="auto"
                mt={4}
                border="2px solid"
                borderColor="gray.300"
            />
            <Flex mt={5} justifyContent='space-between'>
                <Tooltip isDisabled={isDisabled} label='Close' fontSize='md'>
                    <Button width='30%' textAlign="center" colorScheme='red' onClick={onClose}>
                        <CloseButton /><Text ml={1} mr={1}>{close}</Text>
                    </Button>
                </Tooltip>
                <Tooltip isDisabled={isDisabled} label='Upload' fontSize='md'>
                    <Box width='30%' cursor='pointer'>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            id="file-upload"
                            display="none"
                        />
                        <label htmlFor="file-upload">
                            <Button as="span" colorScheme="blue" >
                                <EditIcon/>
                                <Text ml={1} mr={1}>
                                {upload}
                                </Text>
                            </Button>
                        </label>
                    </Box>
                </Tooltip>
                <Tooltip isDisabled={isDisabled} label='Face Capture' fontSize='md'>
                    <Button width='30%' textAlign="center" colorScheme='blue' onClick={onOpenFaceCaptureModal}>
                        <FaCamera /><Text ml={1} mr={1}>{faceCapture}</Text>
                    </Button>
                </Tooltip>
            </Flex>
            <Modal size='2xl' isOpen={isOpenFaceCaptureModal} onClose={onCloseFaceCaptureModal}>
                <ModalOverlay />
                <ModalContent marginTop='20px'>
                    <ModalHeader>Face Capture</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody padding='20px'>
                        <FaceCapture onClose={onCloseFaceCaptureModal} createdUser={createdUser} />
                    </ModalBody>
                </ModalContent>
            </Modal>
            <AlertDialog isOpen={isOpenPreviewAlert} onClose={onClosePreviewAlert} isCentered>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Preview Image
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            <Image src={previewImage} alt="Preview" borderRadius="md" mb={4} />
                        </AlertDialogBody>

                        <AlertDialogFooter justifyContent="space-between">
                            <Button width="30%" colorScheme="yellow" onClick={() => {
                                onClosePreviewAlert()
                            }}>
                                Back
                            </Button>
                            <Button colorScheme="green" width="30%" onClick={saveImage}>
                                Confirm
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}

export default FaceDisplay;
