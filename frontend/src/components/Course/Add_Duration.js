import React, { useEffect, useState } from "react";
import { Button, Flex, FormControl, useToast,FormLabel, Select, Stack, Tooltip } from "@chakra-ui/react";
import { ArrowBackIcon, CheckIcon } from "@chakra-ui/icons";

const AddDuration = ({ isDisabled, assignedYear, assignedSemester, onClose, handleDuration, onCloseSelf}) => {
    const [years, setYears] = useState('');
    const [semesters, setSemesters] = useState('');

    const toast = useToast();
    
    useEffect(()=>{
        if(assignedYear && assignedSemester){
            setYears(assignedYear);
            setSemesters(assignedSemester);
        }
    },[assignedSemester,assignedYear])

    const handleSave = () => {
        if (years && semesters) {
            handleDuration(years, semesters);
            toast({
                title: 'Success',
                position: 'top-right',
                description: 'Duration of the course are temporary added.',
                status: 'info',
                duration: 1000,
                isClosable: true,
            });
            onCloseSelf();
        } else {
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'Please select both number of years and number of semesters.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    }

    return (
        <FormControl height='100%'>
            <Stack spacing={4} height='100%'>
                <Flex direction="column">
                    <FormLabel>Number of years</FormLabel>
                    <Select value={years} onChange={(e) => setYears(e.target.value)} required>
                        <option value="">Select number of years</option>
                        <option value="1">1 Year</option>
                        <option value="2">2 Years</option>
                        <option value="3">3 Years</option>
                        <option value="4">4 Years</option>
                        <option value="5">5 Years</option>
                    </Select>
                </Flex>

                <Flex direction="column">
                    <FormLabel>Number of semesters</FormLabel>
                    <Select value={semesters} onChange={(e) => setSemesters(e.target.value)} required>
                        <option value="">Select number of semesters</option>
                        <option value="1">1 Semester</option>
                        <option value="2">2 Semesters</option>
                        <option value="3">3 Semesters</option>
                        <option value="4">4 Semesters</option>
                    </Select>
                </Flex>
                <Flex mt='auto' justifyContent='space-between'>
                    <Tooltip label='Back' isDisabled={isDisabled}>
                        <Button onClick={onClose} width='40%' colorScheme="blue"> <ArrowBackIcon mr={2}/>Back</Button>
                    </Tooltip>
                    <Tooltip label='Save duration temporary' isDisabled={isDisabled}>
                        <Button 
                            onClick={handleSave} 
                            width='40%' 
                            colorScheme="teal"
                            isDisabled={!years || !semesters}
                        >
                            <CheckIcon mr={2} />
                            Save
                        </Button>
                    </Tooltip>
                </Flex>
            </Stack>
        </FormControl>
    );
}

export default AddDuration;
