import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Center, Flex, Spinner, Stack, Table, Tbody, Td, Text, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import RadioCard from "../Radio/Radio_Card";

const FaceRecognition = ({searchQuery, user}) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(true);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false); 
  const [attendedStudents, setAttendedStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});

  const intervalRef = useRef(null);
  const location = useLocation();
  const { subject_id, date, section } = location.state || {};
  const navigate = useNavigate();
  const toast = useToast();
  
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };

    loadModels();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchStudents = async () => {
    try {
        const response = await axios.post('/display-class-students', { subject_id, date, section });

        const fetchedStudents = response.data.allStudentsInSubject;

        setStudents(fetchedStudents);

        const initialAttendanceStatus = fetchedStudents.reduce((acc, student) => {
            acc[student.id] = student.status || 'Absent'; 
            return acc;
        }, {});

        setAttendanceStatus(initialAttendanceStatus); 
    } catch (error) {
        console.error('Error fetching students:', error);
    } finally {
        setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [subject_id, date]);


  useEffect(() => {
    if (!loadingStudents && students.length > 0) {  
      const hasFacialPath = students.some((student) => student.facial_path !== '');
      
      if (!hasFacialPath) {
        setShowErrorModal(true); 
      }
    }
  }, [loadingStudents, students]);
  
  const getLabeledFaceDescriptions = async () => {
    const filteredStudents = students.filter(student => student.facial_path !== ''); 
    const labels = filteredStudents.map(student => student.facial_path);
  
    return Promise.all(
      labels.map(async (label) => {
        try {
          const descriptions = [];
          const img = await faceapi.fetchImage(`http://localhost:5000/uploads/${label}`);
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  
          if (detections) {
            descriptions.push(detections.descriptor);
          } else {
            console.log(`No detection found for label: ${label}`);
            descriptions.push(new Float32Array(128));  
          }
  
          return new faceapi.LabeledFaceDescriptors(label, descriptions);
        } catch (err) {
          console.error(`Error fetching/processing image for label ${label}:`, err);
          return new faceapi.LabeledFaceDescriptors(label, [new Float32Array(128)]);
        }
      })
    );
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVideoOnPlay = async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  
    intervalRef.current = setInterval(async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
  
        faceapi.matchDimensions(canvasRef.current, displaySize);
  
        if (!modelsLoaded) return;
  
        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
        if (!detections || detections.length === 0) {
          console.warn('No faces detected');
          return;
        }
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
        // Check if canvasRef.current is not null before accessing its context
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
          const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
  
          results.forEach((result, i) => {
            if (result.distance < 0.48) {
              // Handle recognized faces
              setAttendedStudents((prevAttendedStudents) => {
                if (!prevAttendedStudents.includes(result.label)) {
                  const recognizedStudent = students.find(student => student.facial_path === result.label);
              
                  if (recognizedStudent) {
                    setAttendanceStatus(prev => ({
                      ...prev,
                      [recognizedStudent.id]: 'Present',
                    }));
                  }
              
                  return [...prevAttendedStudents, result.label];
                }
                return prevAttendedStudents;
              });
            }else if (resizedDetections[i] && result.label === 'unknown') {
              // Handle unrecognized faces
              if (resizedDetections[i] && resizedDetections[i].detection.box) {
                const box = resizedDetections[i].detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, { label: 'Unknown' });
                drawBox.draw(canvasRef.current);
              } else {
                console.warn('Invalid detection box for unrecognized face');
              }
              
              console.log('Unknown face detected');
            }
        
            // Draw bounding box for recognized faces with a confidence level > 20%
            if (resizedDetections[i] && result.distance < 0.8 && result.label !== 'unknown') {
              const box = resizedDetections[i].detection.box;
              const drawBox = new faceapi.draw.DrawBox(box, { 
                label: `${result.label} (${((1 - result.distance) * 100).toFixed(2)}%)` 
              });
              drawBox.draw(canvasRef.current);
            }
        });
        
        }
      }
    }, 300);
  };
  

  const handleAttendanceChange = (studentId, value) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: value, 
    }));
    if (value === 'Present') {
      setAttendedStudents((prev) => {
          if (!prev.includes(studentId)) {
              return [...prev, studentId];
          }
          return prev;
      });
    } else {
        setAttendedStudents((prev) => prev.filter(id => id !== studentId));
    }
  };

  useEffect(() => {
    if (attendedStudents.length > 0) {
      const hasAttendanceChanged = students.some(student => 
        attendanceStatus[student.id] && attendanceStatus[student.id] !== student.status
      );
  
      if (hasAttendanceChanged) {
        handleConfirmClass(); 
      }
    }
  }, [attendedStudents, attendanceStatus]);
  
  const handleConfirmClass = async() => {
    const transformedAttendance = Object.entries(attendanceStatus)
    .map(([student_id, status]) => ({
      student_id,
      status
    }));
    try {
      const response = await axios.post('/add-attendance', {
          subject_id,
          records: transformedAttendance,
          date
      });

      if (response.status === 201) {
          toast({
              title: 'Success',
              position: 'top-right',
              description: 'Attendance records successfully saved!',
              status: 'success',
              duration: 1000,
              isClosable: true,
          });
          await fetchStudents();
      }
    } catch (err) {
        console.error('Error saving attendance records:', err);
        const errorMessage = err.response?.data?.error || 'Failed to save attendance records. Please try again.';
        toast({
            title: 'Error',
            position: 'top-right',
            description: errorMessage,
            status: 'error',
            duration: 1000,
            isClosable: true,
        });
    }
  }

  const handleEndClass = async() => {
      try {
        handleConfirmClass();
        const time = 'end';

        if (!subject_id || !user) {
            console.error("Missing subject_id or user");
            throw new Error("Missing subject_id or user information");
        }

        const response = await axios.post('/alter-session-logs', {
            subject_id,
            section,
            user,
            time,
            date
        });

        if (response.status === 200) {
            toast({
                title: 'Class started',
                position: 'top-right',
                description: `Class ${time === 'end'? 'ended' : 'started' } by ${user.name}`,
                status: "success",
                duration: 1000,
                isClosable: true,
            });
        }
    } catch (error) {
        console.error("Error starting class:", error.response || error.message);
        toast({
            title: 'Error',
            position: 'top-right',
            description: error.response?.data?.message || "There was an error starting the class.",
            status: "error",
            duration: 1000,
            isClosable: true,
        });
    }finally{
      navigate(-1);
    }
  }

  const totalPresent = students.filter(student => 
    attendanceStatus[student.id] === 'Present'
  ).length;
  
  const totalAbsent = students.filter(student => 
    attendanceStatus[student.id] === 'Absent'
  ).length;
  
  const totalExcused = students.filter(student => 
    attendanceStatus[student.id] === 'Excused' 
  ).length;

  const totalNoFacialPath = students.filter(student => 
    student.facial_path === ''
  ).length;

  return (
    <Box padding='10px'>
      {modelsLoaded && !showErrorModal ? (
        <>
          {loadingStudents ? (
            <Center flexDirection="column" height="50vh">
              <Spinner />
              <Text mt={2}>Loading students...</Text>
            </Center>
          ) : isWebcamActive ? (
            <>
            <Flex flexDirection='row' width='100%' height='100%'>
              <Flex flexDirection='column' position='relative' width='640px' height='480px'>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  width={640}
                  height={480}
                  onUserMedia={handleVideoOnPlay}
                  videoConstraints={{ facingMode: "user" }}
                />
                <canvas
                  ref={canvasRef}
                  style={{ position: 'absolute', top: 0, left:  0 }}
                  width={640}
                  height={480}
                />
              </Flex>
              
              <Flex flexDirection='column' justifyContent='space-between' alignItems='flex-start' padding='10px' height='480px' maxHeight='480px' overflowY='auto'>
                <Table>
                  <Thead>
                    <Tr>
                      <Th padding='0px 10px'>
                        Present {totalPresent}
                      </Th>
                      <Th padding='0px 10px'>
                        Absent {totalAbsent}
                      </Th>
                      <Th padding='0px 10px'>
                        Excused {totalExcused}
                      </Th>
                      <Th padding='0px 10px'>
                        No Facial Path {totalNoFacialPath}
                      </Th>
                      <Th padding='0px 10px' textAlign='center'>
                        Actions
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredStudents.map((student) => {
                      const options = ['Present', 'Absent', 'Excused'];
                      const isPresent = student.status === 'Present';
                      const isAbsent = student.status === 'Absent' ;
                      const isExcused = student.status === 'Excused';
                      const hasNoFacialPath = student.facial_path === '';
                      return (
                        <Tr key={student.id}>
                          <Td padding='5px 10px'>
                            {isPresent ? student.name : ''}
                          </Td>
                          <Td padding='5px 10px'>
                            {isAbsent && !isPresent ? student.name : ''}
                          </Td>
                          <Td padding='5px 10px'>
                            {isExcused && !isPresent ? student.name : ''}
                          </Td>
                          <Td padding='5px 10px'>
                            {hasNoFacialPath ? student.name : ''}
                          </Td>
                          <Td padding='5px 10px'>
                            <Stack direction="row">
                              {options.map((option) => (
                                <RadioCard
                                  onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                                  key={option}
                                  value={option}
                                  isChecked={attendanceStatus[student.id] === option} 
                                >
                                  {option}
                                </RadioCard>
                              ))}
                            </Stack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>

                </Table>
              </Flex>
            </Flex>
            <Flex mt={4} width='100%' justifyContent='space-between'>
              <Button width='45%' colorScheme='red' onClick={() => navigate(-1)}>
                Go back
              </Button>
              <Button colorScheme='green' width='45%' onClick={()=>handleEndClass()} marginTop='10px'>End Class</Button>
            </Flex>
          </>
          ) : null}
        </>
      ) : (
        <Center flexDirection="column" height="50vh">
          <Spinner />
          <Text mt={2}>Loading models...</Text>
        </Center>
      )}

      <AlertDialog motionPreset='slideInBottom' isCentered isOpen={showErrorModal} onClose={() => navigate(-1)}>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Error</AlertDialogHeader>
          <AlertDialogBody>
            <Text>No students have valid facial paths. Please check the data.</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button colorScheme='red' onClick={() => navigate(-1)}  mt={4}>
              Go back
            </Button>
          </AlertDialogFooter>
          
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};

export default FaceRecognition;
