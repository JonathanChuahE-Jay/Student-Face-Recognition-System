import React, { useState, useEffect, useRef } from 'react';
import {
    Flex,
    Code,
    FormControl,
    FormLabel,
    Input,
    Avatar,
    Button,
    AvatarBadge,
    useToast,
    Select,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tooltip,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    useBreakpointValue,
    Box,
    useDisclosure,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Text,
    Divider,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Image 
} from '@chakra-ui/react';
import { ArrowBackIcon, AttachmentIcon, CheckIcon, EditIcon, InfoIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { FaQuestionCircle } from 'react-icons/fa';
import info from "../../Assets/Images/parse_json_info.png";

const AddNewSubject = ({ isDisabled, onClose, onUpdate }) => {
    const [formattedSectionTimes, setFormattedSectionTimes] = useState([]);
    const [sectionTimes, setSectionTimes] = useState([]);
    const [subjectCode, setSubjectCode] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [subjectPicture, setSubjectPicture] = useState(null);
    const [subjectSection, setSubjectSection] = useState('');
    const [subjectSectionOthers, setSubjectSectionOthers] = useState('');
    const [numberOfSections, setNumberOfSections] = useState(1);
    const [venue, setVenue] = useState('');
    const [day, setDay]= useState('');
    const [maxStudents, setMaxStudents]= useState([]);
    const [jsonContent, setJsonContent] = useState([]);
    const fileInputRef = useRef(null);

    const { isOpen: isOpenSectionDrawer, onOpen: onOpenSectionDrawer, onClose: onCloseSectionDrawer} = useDisclosure();
    const { isOpen: isOpenJsonModal, onOpen: onOpenJsonModal, onClose: onCloseJsonModal} = useDisclosure();

    const toast = useToast();

    const handleSubjectCode = (e) => setSubjectCode(e.target.value);
    const handleSubjectName = (e) => setSubjectName(e.target.value);

    const jsonInfo = `[
        {\n
            "subjectName": "Software Principle",\n
            "subjectCode": "SP0192",\n
            "subjectSection": "MPU Compulsory",\n
            "numberOfSections": 4,\n
            "sectionTimes": [\n
                { "startTime": "10:00", "endTime": "12:00", "day": "Tuesday", "venue": "Room 201", "maxStudents": 25 },\n
                { "startTime": "13:00", "endTime": "15:00", "day": "Thursday", "venue": "Room 202", "maxStudents": 25 },\n
            ]\n
        }\n
    ]`;

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
                reader.onloadend = () => setSubjectPicture(reader.result);
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
            }
        }
    };

    const handleSubjectSection = (e) => {
        const selectedSection = e.target.value;
        setSubjectSection(selectedSection);

        if (selectedSection !== 'None of these above') {
            setSubjectSectionOthers('');
        }
    };

    const handleSubjectSectionOthers = (e) => setSubjectSectionOthers(e.target.value);

    const handleNumberOfSectionsChange = (value) => setNumberOfSections(parseInt(value));

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const response = await axios.post('http://localhost:5000/add-new-subject', {
                subjectCode,
                subjectName,
                subjectPicture,
                subjectSection: subjectSection === 'None of these above' ? subjectSectionOthers : subjectSection,
                numberOfSections,
                sectionTimes: formattedSectionTimes,
            });
    
            if (response.status === 201) {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: 'Subject successfully registered',
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });
                setSubjectCode('');
                setSubjectName('');
                setSubjectPicture(null);
                setSubjectSection('');
                setSubjectSectionOthers('');
                setNumberOfSections(1);
                onUpdate();
                onClose();
            } else {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: response.data.error || 'An unexpected error occurred',
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            toast({
                title: 'Error',
                position: 'top-right',
                description: `${errorMessage}`,
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };

    const backLabel = useBreakpointValue({ base: "", md: " Back" });
    const saveTimeLabel = useBreakpointValue({ base: "", md: " Save Times" });
    
    useEffect(() => {
        setSectionTimes(Array.from({ length: numberOfSections }, () => ({
            startHours: 0,
            startMinutes: 0,
            endHours: 0,
            endMinutes: 0
        })));
    }, [numberOfSections]);

    const handleTimeChange = (index, field, value) => {
        const newTimes = [...sectionTimes];
        newTimes[index] = { ...newTimes[index], [field]: Number(value) };
        setSectionTimes(newTimes);
    };

    const handleDayChange = (index, value) => {
        const updatedDay = [...day];
        updatedDay[index] = value;
        setDay(updatedDay);
    };
    
    const handleVenue = (index, value) => {
        const updatedVenues = [...venue];
        updatedVenues[index] = value;
        setVenue(updatedVenues);
    };

    const handleMaxStudentsChange = (index, value) => {
        const updatedMaxStudents = [...maxStudents];
        updatedMaxStudents[index] = Number(value)|| 0;
        setMaxStudents(updatedMaxStudents);
    }

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                const parsedJson = JSON.parse(e.target.result);
                if (Array.isArray(parsedJson)) {
                    let isValid = true;
                    for (const subject of parsedJson) {
                        if (
                            !subject.subjectCode ||
                            !subject.subjectName ||
                            !subject.numberOfSections ||
                            !Array.isArray(subject.sectionTimes) ||
                            subject.sectionTimes.length === 0
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
                            description: "Each subject must contain the required fields: subjectCode, subjectName, numberOfSections, and sectionTimes.",
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

    const onSubjectsCreated = async () => {
        const successSubjects = [];
        const errorSubjects = [];
    
        for (const subject of jsonContent) {
            const {
                subjectCode,
                subjectName,
                subjectPicture,
                subjectSection,
                subjectSectionOthers,
                numberOfSections,
                sectionTimes,
            } = subject;
    
            try {
                const response = await axios.post('http://localhost:5000/add-new-subject', {
                    subjectCode,
                    subjectName,
                    subjectPicture,
                    subjectSection: subjectSection === 'None of these above' ? subjectSectionOthers : subjectSection,
                    numberOfSections,
                    sectionTimes,
                });
    
                if (response.status === 201) {
                    successSubjects.push(subjectName);
                } else {
                    errorSubjects.push({ name: subjectName, error: response.data.error || 'Unknown error' });
                }
            } catch (error) {
                const errorMessage = error.response?.data?.error || error.message;
                errorSubjects.push({ name: subjectName, error: errorMessage });
            }
        }
    
        if (successSubjects.length > 0) {
            toast({
                title: 'Subjects Registered',
                position: 'top-right',
                description: `${successSubjects.length} subjects successfully registered.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        }
    
        if (errorSubjects.length > 0) {
            const errorDetails = errorSubjects
                .map(({ name, error }) => `${name}: ${error}`)
                .join(', ');
            toast({
                title: 'Errors Occurred',
                position: 'top-right',
                description: `Failed to register ${errorSubjects.length} subjects. ${errorDetails}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    
        onUpdate();
        onClose();
    };
    
    
    const handleSaveTime = () => {
        const formattedSectionTimes = sectionTimes.map((time, index) => {
            const startTime = `${String(time.startHours).padStart(2, '0')}:${String(time.startMinutes).padStart(2, '0')}`;
            const endTime = `${String(time.endHours).padStart(2, '0')}:${String(time.endMinutes).padStart(2, '0')}`;
    
            return {
                sectionNumber: index + 1,
                startTime,
                endTime,
                day: day[index] || '', 
                venue: venue[index] || '',
                maxStudents: maxStudents[index] || 0 
            };
        });
        setFormattedSectionTimes(formattedSectionTimes);

        onCloseSectionDrawer();
    };

    
    return (
        <Flex >
            <FormControl as="form" padding={'5px'} borderRadius={'20px'} onSubmit={handleSubmit}>
                <Flex justifyContent={'center'}>
                    <Avatar size='2xl' src={subjectPicture || 'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'}>
                        <AvatarBadge bg={'white'} boxSize='1.25em'>
                            <label htmlFor="profilePictureInput" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                <EditIcon boxSize="0.6em" color={'black'} />
                            </label>
                            <Input
                                name="subject_picture"
                                id="profilePictureInput"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicture}
                                style={{ display: "none" }}
                            />
                        </AvatarBadge>
                    </Avatar>
                </Flex>
                <FormLabel marginTop={'20px'}>Subject Code:</FormLabel>
                <Input
                    required
                    variant='flushed'
                    name='subject_code'
                    placeholder='Enter subject code'
                    value={subjectCode}
                    onChange={handleSubjectCode}
                />
                <FormLabel marginTop={'20px'}>Subject Name:</FormLabel>
                <Input
                    required
                    variant='flushed'
                    name='subject_name'
                    placeholder='Enter subject name'
                    value={subjectName}
                    onChange={handleSubjectName}
                />
                <FormLabel marginTop={'20px'}>Subject Section:</FormLabel>
                <Select
                    required
                    onChange={handleSubjectSection}
                    placeholder='Select option'
                    value={subjectSection}
                >
                    <option value='Free Module'>Free Module</option>
                    <option value='Technical Electives'>Technical Electives</option>
                    <option value='College Compulsory'>College Compulsory</option>
                    <option value='MPU Compulsory'>MPU Compulsory</option>
                    <option value='Core'>Core</option>
                    <option value='None of these above'>None of these above</option>
                </Select>
                {subjectSection === 'None of these above' && (
                    <Input
                        marginTop={'10px'}
                        placeholder='Specify others'
                        value={subjectSectionOthers}
                        onChange={handleSubjectSectionOthers}
                        required
                    />
                )}
                <FormLabel marginTop={'20px'}>Number of Sections:</FormLabel>
                <Flex mb={5}>
                    <NumberInput
                        width='90%'
                        min={1}
                        defaultValue={1}
                        value={numberOfSections}
                        onChange={handleNumberOfSectionsChange}
                    >
                        <NumberInputField/>
                        <NumberInputStepper>
                            <NumberIncrementStepper/>
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                    <IconButton onClick={onOpenSectionDrawer} icon={<EditIcon/>} marginLeft='5px'/>
                </Flex>
                <Flex mt={1} width="100%" justifyContent='space-between'>
                    <Tooltip isDisabled={isDisabled} label="Parse JSON" fontSize="md">
                        <Button
                            width="30%"
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
                            left="160px"
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
                            style={{
                                whiteSpace: "pre-wrap",
                                backgroundColor: "#f8f9fa",
                                padding: "10px",
                                borderRadius: "5px",
                                fontSize: "0.8rem",
                                overflowX: "auto",
                                color: "black",
                            }}
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
                        <Button width='30%' type='submit' colorScheme='teal'>
                            <CheckIcon ml={1} mr={1} />Create
                        </Button>
                    </Tooltip>
                </Flex>
            </FormControl>
            <Drawer placement='bottom' isOpen={isOpenSectionDrawer} onClose={onCloseSectionDrawer}>
            <DrawerOverlay />
            <DrawerContent>
                <DrawerHeader>Section</DrawerHeader>
                <DrawerBody>
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th padding='10px 5px'>Section</Th>
                                <Th padding='10px 5px'>Start Time</Th>
                                <Th padding='10px 5px'>End Time</Th>
                                <Th padding='10px 5px'>Day</Th>
                                <Th padding='10px 5px'>Venue</Th>
                                <Th padding='10px 5px'>Max Student</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {Array.from({ length: numberOfSections }, (_, index) => (
                                <Tr key={index}>
                                    <Td padding='10px 5px'>Section {index + 1}</Td>
                                    <Td padding='10px 5px'>
                                        <Flex align="center">
                                            <NumberInput
                                                value={sectionTimes[index]?.startHours || 0}
                                                onChange={(value) => handleTimeChange(index, 'startHours', value)}
                                                min={0}
                                                max={23}
                                                step={1}
                                                width="80%"
                                                mr={2}
                                            >
                                                <NumberInputField placeholder="HH" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                            <Box>:</Box>
                                            <NumberInput
                                                value={sectionTimes[index]?.startMinutes || 0}
                                                onChange={(value) => handleTimeChange(index, 'startMinutes', value)}
                                                min={0}
                                                max={59}
                                                step={1}
                                                width="80%"
                                                ml={2}
                                            >
                                                <NumberInputField placeholder="MM" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </Flex>
                                    </Td>
                                    <Td padding='10px 5px'>
                                        <Flex align="center">
                                            <NumberInput
                                                value={sectionTimes[index]?.endHours || 0}
                                                onChange={(value) => handleTimeChange(index, 'endHours', value)}
                                                min={0}
                                                max={23}
                                                step={1}
                                                width="80%"
                                                mr={2}
                                            >
                                                <NumberInputField placeholder="HH" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                            <Box>:</Box>
                                            <NumberInput
                                                value={sectionTimes[index]?.endMinutes || 0}
                                                onChange={(value) => handleTimeChange(index, 'endMinutes', value)}
                                                min={0}
                                                max={59}
                                                step={1}
                                                width="80%"
                                                ml={2}
                                            >
                                                <NumberInputField placeholder="MM" />
                                                <NumberInputStepper>
                                                    <NumberIncrementStepper />
                                                    <NumberDecrementStepper />
                                                </NumberInputStepper>
                                            </NumberInput>
                                        </Flex>
                                    </Td>
                                    <Td padding='10px 5px'>
                                        <Select value={day[index] || ''} onChange={(e) => handleDayChange(index, e.target.value)} required>
                                            <option value=''>Select a day</option>
                                            <option value='Monday'>Monday</option>
                                            <option value='Tuesday'>Tuesday</option>
                                            <option value='Wednesday'>Wednesday</option>
                                            <option value='Thursday'>Thursday</option>
                                            <option value='Friday'>Friday</option>
                                            <option value='Saturday'>Saturday</option>
                                            <option value='Sunday'>Sunday</option>
                                        </Select>
                                    </Td>
                                    <Td padding='10px 5px'>
                                        <Input value={venue[index] || ''} onChange={(e)=> handleVenue(index, e.target.value)} placeholder='Enter Venue...' width='100%' list='datalist-venue'></Input>
                                        <datalist id='datalist-venue'>    
                                            <option>COE</option>
                                            <option>CCI</option>
                                            <option>BN</option>
                                            <option>BM</option>
                                            <option>TA</option>
                                            <option>VL</option>
                                            <option>BC</option>
                                            <option>BA</option>
                                            <option>BB</option>
                                            <option>InfoLab</option>
                                            <option>InfoLab 2</option>
                                            <option>BV1</option>
                                            <option>BL</option>
                                        </datalist>
                                    </Td>
                                    <Td padding='10px 5px'>
                                        <NumberInput
                                            value={maxStudents[index] || 0}
                                            onChange={(valueString) => handleMaxStudentsChange(index, valueString)}
                                            min={1}
                                            step={1}
                                            width="100%"
                                            ml={2}
                                        >
                                            <NumberInputField placeholder="MS" />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </Td>

                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                    <Flex marginTop={5} justifyContent='space-between'>
                        <Button onClick={onCloseSectionDrawer} colorScheme='blue' width='20%'>
                            <ArrowBackIcon ml={2} mr={2} /> {backLabel}
                        </Button>
                        <Button width='20%' colorScheme="teal" onClick={handleSaveTime}>
                            <CheckIcon ml={2} mr={2} /> {saveTimeLabel}
                        </Button>
                    </Flex>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
        <Modal isOpen={isOpenJsonModal} onClose={onCloseJsonModal}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Parsed Subjects</ModalHeader>
                <ModalCloseButton />
                <ModalBody maxHeight="60vh" overflowY="auto">
                    {jsonContent.map((json, index) => (
                        <Box key={index} mb={4}>
                            <Text fontSize="2xl" color='blue' fontWeight="bold">Subject Number: {index+1}</Text>
                            <Box mb={4}>
                                <Text fontSize="lg" fontWeight="bold">Subject Name:</Text>
                                <Text fontSize="md">{json.subjectName}</Text>
                            </Box>
                            <Box mb={4}>
                                <Text fontSize="lg" fontWeight="bold">Subject Code:</Text>
                                <Text fontSize="md">{json.subjectCode}</Text>
                            </Box>
                            <Box mb={4}>
                                <Text fontSize="lg" fontWeight="bold">Subject Section:</Text>
                                <Text fontSize="md">{json.subjectSection}</Text>
                            </Box>
                            <Box mb={4}>
                                <Text fontSize="lg" fontWeight="bold">Number of Sections:</Text>
                                <Text fontSize="md">{json.number_of_sections}</Text>
                            </Box>

                            <Divider mb={4} />
                            
                            <Box>
                                <Text fontSize="lg" fontWeight="bold">Section Times:</Text>
                                {json.sectionTimes.map((section, sectionIndex) => (
                                    <Box key={sectionIndex} mb={4} borderWidth={1} borderRadius="md" p={4}>
                                        <Text fontSize="md" fontWeight="bold">Section {sectionIndex+1}</Text>
                                        <Text><strong>Start Time:</strong> {section.startTime}</Text>
                                        <Text><strong>End Time:</strong> {section.endTime}</Text>
                                        <Text><strong>Day:</strong> {section.day}</Text>
                                        <Text><strong>Venue:</strong> {section.venue}</Text>
                                        <Text><strong>Max Students:</strong> {section.maxStudents}</Text>
                                    </Box>
                                ))}
                            </Box>

                            <Divider mb={4} />
                        </Box>
                    ))}
                </ModalBody>
                <ModalFooter display='flex' justifyContent='space-between'>
                    <Button colorScheme="red" onClick={onClose} width='25%'>
                        Close
                    </Button>
                    <Button  colorScheme="blue"onClick={onSubjectsCreated} width='25%'>
                        Submit
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    </Flex>
    );
};

export default AddNewSubject;
