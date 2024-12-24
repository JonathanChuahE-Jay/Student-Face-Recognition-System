import { ArrowBackIcon, CheckIcon } from "@chakra-ui/icons";
import { Box, Button, DrawerBody, Flex, Input, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, Table, Tbody, Td, Th, Thead, Tooltip, Tr, useBreakpointValue, useToast } from "@chakra-ui/react";
import React from "react";
import axios from "axios";

const SubjectSections = ({maxStudents, setMaxStudents,sectionTimes, setSectionTimes, day, setDay, venue, setVenue, subject, fetchSections, onCloseSectionDrawer, numberOfSections, isDisabled, backLabel}) => {
    const toast = useToast();
    const saveDetailsLabel = useBreakpointValue({ base: "", md: " Save Details" });
    
    // Handle time changes in the drawer
    const handleTimeChange = (index, field, value) => {
        const newTimes = [...sectionTimes];
        newTimes[index] = { ...newTimes[index], [field]: Number(value) };
        setSectionTimes(newTimes);
    };
    
    // Day change
    const handleDayChange = (index, value) => {
        const updatedSectionTimes = [...sectionTimes];
        updatedSectionTimes[index] = { ...updatedSectionTimes[index], day: value };
        setSectionTimes(updatedSectionTimes);  
    
        const updatedDay = [...day];
        updatedDay[index] = value; 
        setDay(updatedDay);
    };

    // Save Venue
    const handleVenue = (index, value) => {
        const updatedSectionTimes = [...sectionTimes];
        updatedSectionTimes[index] = { ...updatedSectionTimes[index], venue: value };
        setSectionTimes(updatedSectionTimes);
    
        const updatedVenues = [...venue];
        updatedVenues[index] = value;
        setVenue(updatedVenues);
    };

    // Max Students
    const handleMaxStudentsChange = (index, value) => {
        const updatedSectionTimes = [...sectionTimes];
        updatedSectionTimes[index] = { ...updatedSectionTimes[index], maxStudents: value };
        setSectionTimes(updatedSectionTimes);

        const updatedMaxStudents = [...maxStudents];
        updatedMaxStudents[index] = Number(value);
        setMaxStudents(updatedMaxStudents);
    }

    // Save
    const handleSave = (e) =>{
        e.preventDefault();
        const formattedSectionTimes = sectionTimes.map((time, index) => {
            const startTime = `${String(time.startHours).padStart(2, '0')}:${String(time.startMinutes).padStart(2, '0')}`;
            const endTime = `${String(time.endHours).padStart(2, '0')}:${String(time.endMinutes).padStart(2, '0')}`;
            const maxStudentsValue = Number(maxStudents[index]) || 0;
            return {
                sectionNumber: index + 1,
                startTime,
                endTime,
                venue: time.venue, 
                day: time.day,
                max_students: maxStudentsValue
            };
        });   
        const updatedSubject = {
            id: subject.id,
            numberOfSections,
            sectionTimes: formattedSectionTimes,
            venue,
            day
        };
        axios.post('http://localhost:5000/update-subject', updatedSubject)
            .then(response => {
                const { message, error } = response.data;
                if (error) {
                    toast({
                        title: 'Error',
                        position: 'top-right',
                        description: error, 
                        status: 'error',
                        duration: 1000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: 'Success',
                        position: 'top-right',
                        description: `Subject's section successfully updated`,
                        status: 'success',
                        duration: 1000,
                        isClosable: true,
                    });
                    onCloseSectionDrawer();
                }
            })
            .catch((error) => {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: error.response?.data?.error || `An error occurred: ${error.message}`,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            });
    }

    // Cancel 
    const handleCancel = () => {
        fetchSections();
        onCloseSectionDrawer();
    }
    
    return(
        <DrawerBody>
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th padding='10px 5px'>Section</Th>
                        <Th padding='10px 5px'>Start Time</Th>
                        <Th padding='10px 5px'>End Time</Th>
                        <Th padding='10px 5px'>Day</Th>
                        <Th padding='10px 5px'>Venue</Th>
                        <Th padding='10px 5px'>Max Students</Th>
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
                                <Select
                                    value={sectionTimes[index]?.day || ''}
                                    onChange={(e) => handleDayChange(index, e.target.value)}
                                    placeholder="Select day"
                                >
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                    <option value="Sunday">Sunday</option>
                                </Select>
                            </Td>
                            <Td padding='10px 5px'>
                                <Input value={sectionTimes[index]?.venue || ''} onChange={(e)=> handleVenue(index, e.target.value)} placeholder='Enter Venue...' width='100%' list='datalist-venue'></Input>
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
                                    value={maxStudents[index]?maxStudents[index] :  0}
                                    onChange={(valueString) => handleMaxStudentsChange(index, valueString)}
                                    min={0}
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
                <Tooltip isDisabled={isDisabled} label='Back' fontSize='md'><Button onClick={handleCancel} colorScheme='blue' width='20%'> <ArrowBackIcon ml={2} mr={2}/> {backLabel}</Button></Tooltip>
                <Tooltip isDisabled={isDisabled} label='Save' fontSize='md'><Button width='20%' colorScheme="teal" onClick={handleSave}>
                        <CheckIcon ml={2} mr={2}/>{saveDetailsLabel}
                    </Button>
                </Tooltip>
            </Flex>
        </DrawerBody>
    )

}

export default SubjectSections;