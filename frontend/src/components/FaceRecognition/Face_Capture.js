import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { Box, Button, Center, Flex, Spinner, useToast } from "@chakra-ui/react";
import axios from "axios";

const FaceCapture = ({ onClose, createdUser }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const intervalRef = useRef(null);
  
  const toast = useToast();

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setModelsLoaded(false);
      }
    };
    loadModels();
  
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);  

  const handleVideoOnPlay = () => {
    intervalRef.current = setInterval(async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        try {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          if (detections.length > 0) {
            const resizedDetections = faceapi.resizeResults(detections, displaySize).filter(detection => {
              const { box } = detection.detection;
              return box && box.x !== null && box.y !== null && box.width !== null && box.height !== null;
            });            
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            resizedDetections.forEach(detection => {
              if (detection && detection.detection.box) {
                faceapi.draw.drawDetections(canvasRef.current, [detection]);
                faceapi.draw.drawFaceLandmarks(canvasRef.current, [detection]);
                faceapi.draw.drawFaceExpressions(canvasRef.current, [detection]);
              } else {
                console.warn('Invalid bounding box detected:');
              }            
            });
          } else {
            console.log('No faces detected');
          }
        } catch (error) {
          console.error('Error during face detection:', error);
        }
      }
    }, 400);
  };

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
    handleVideoOnPlay();
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
      {modelsLoaded ? (
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
                onUserMedia={handleVideoOnPlay}
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
      ) : (
        <Center flexDirection='column' height='50vh'>
          <Spinner />
          <p>Loading models...</p>
        </Center>
      )}
    </Box>
  );
};

export default FaceCapture;
