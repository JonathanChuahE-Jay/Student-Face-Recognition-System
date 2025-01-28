import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { Box, Button, Center, Flex, Spinner, useToast } from "@chakra-ui/react";
import axios from "axios";

const FaceCapture = ({ onClose, createdUser, onRefresh }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isWebcamActive, setIsWebcamActive] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const intervalRef = useRef(null);

  const toast = useToast();

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setIsWebcamActive(false);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    setIsWebcamActive(true);
  };

  const saveImage = async () => {
    if (capturedImage) {
      const byteString = atob(capturedImage.split(',')[1]);
      const mimeString = capturedImage.split(',')[0].split(':')[1].split(';')[0];
      const ab = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        ab[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      const formData = new FormData();
      formData.append('image', blob, `${createdUser.name}.jpg`);
      formData.append('user_id', createdUser.user_id);

      try {
        const response = await axios.post('http://localhost:5000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast({
          position: 'top-right',
          title: 'Success',
          description: response.data.message || 'Image uploaded successfully.',
          status: 'success',
          duration: 1000,
          isClosable: true,
        });
        onClose();
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || 'An error occurred. Please try again.';
        console.error('Error uploading image:', error);
        toast({
          position: 'top-right',
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 1000,
          isClosable: true,
        });
      }
    }
    
  };

  return (
    <Box>
      <>
        {isWebcamActive ? (
          <Box style={{ position: 'relative', width: '640px', height: '480px' }}>
            {/* Webcam video */}
            <Webcam
              ref={webcamRef}
              audio={false}
              width={640}
              height={480}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
            />
            {/* Canvas for face detection */}
            <canvas
              ref={canvasRef}
              style={{ position: 'absolute', top: 0, left: 0 }}
              width={640}
              height={480}
            />
          </Box>
        ) : (
          <Center>
            {capturedImage && <img src={capturedImage} alt="Captured" />}
          </Center>
        )}

        {!isWebcamActive && !capturedImage && (
          <p>Processing image...</p>
        )}

        {isWebcamActive ? (
          <Flex mt={2} justifyContent='space-between'>
            <Button width='45%' colorScheme="red" onClick={onClose}>Maybe Later</Button>
            <Button width='45%' colorScheme="teal" onClick={captureImage}>Capture Image</Button>
          </Flex>
        ) : (
          <Flex mt={2} justifyContent='space-between'>
            <Button width='45%' onClick={retakeImage}>Retake</Button>
            <Button width='45%' onClick={saveImage}>Continue</Button>
          </Flex>
        )}
      </>

    </Box>
  );
};

export default FaceCapture;
