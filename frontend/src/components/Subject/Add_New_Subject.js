import React, { useState, useEffect } from 'react';
import {
    Flex,
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
    IconButton
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, EditIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
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

    const { isOpen: isOpenSectionDrawer, onOpen: onOpenSectionDrawer, onClose: onCloseSectionDrawer} = useDisclosure();
   
    const toast = useToast();

    // Handle subject code change
    const handleSubjectCode = (e) => setSubjectCode(e.target.value);

    // Handle subject name change
    const handleSubjectName = (e) => setSubjectName(e.target.value);

    // Handle image file selection and compression
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

    // Handle section selection and reset "Others" if applicable
    const handleSubjectSection = (e) => {
        const selectedSection = e.target.value;
        setSubjectSection(selectedSection);

        if (selectedSection !== 'None of these above') {
            setSubjectSectionOthers('');
        }
    };

    // Handle input change for "Others" section
    const handleSubjectSectionOthers = (e) => setSubjectSectionOthers(e.target.value);

    // Handle number of sections change
    const handleNumberOfSectionsChange = (value) => setNumberOfSections(parseInt(value));

    // Handle form submission
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
                // Reset form fields
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

    // Handle time changes in the drawer
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
    
    // Save Venue
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

    // Save Time into one variable
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
                <Flex>
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
                <Tooltip isDisabled={isDisabled} label='Create' fontSize='md'>
                    <Button marginTop={'20px'} width={'100%'} type='submit' colorScheme='teal'>
                        <CheckIcon ml={1} mr={1} />Create
                    </Button>
                </Tooltip>
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
        </Flex>
    );
};

export default AddNewSubject;
