import { Box, Button, CloseButton, Flex, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, Tooltip, useBreakpointValue, useDisclosure } from "@chakra-ui/react";
import React from "react";
import FaceCapture from "./Face_Capture";
import { FaCamera } from "react-icons/fa";

const FaceDisplay = ({createdUser,isDisabled, onClose}) => {

    const { isOpen: isOpenFaceCaptureModal, onOpen: onOpenFaceCaptureModal, onClose: onCloseFaceCaptureModal } = useDisclosure();
        
    const faceCapture = useBreakpointValue({ base: "", md: " Change" });
    const close = useBreakpointValue({ base: "", md: " Close" });

    const imageUrl = `http://localhost:5000/uploads/${createdUser.facial_path}`;
    return(
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
                    <Button width='33%' textAlign="center" colorScheme='red' onClick={onClose}>
                        <CloseButton/><Text ml={1} mr={1}>{close}</Text>
                    </Button>
                </Tooltip>
                <Tooltip isDisabled={isDisabled} label='Face Capture' fontSize='md'>
                    <Button width='33%' textAlign="center" colorScheme='blue' onClick={onOpenFaceCaptureModal}>
                        <FaCamera/><Text ml={1} mr={1}>{faceCapture}</Text>
                    </Button>
                </Tooltip>
            </Flex>
            <Modal size='2xl' isOpen={isOpenFaceCaptureModal} onClose={onCloseFaceCaptureModal}>
                <ModalOverlay/>
                <ModalContent marginTop='20px'>
                    <ModalHeader>Face Capture</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody padding='20px'>
                        <FaceCapture onClose={onCloseFaceCaptureModal} createdUser={createdUser}/>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default FaceDisplay;
