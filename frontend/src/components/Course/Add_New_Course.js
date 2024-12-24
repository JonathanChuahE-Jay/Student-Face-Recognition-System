import React, { useEffect, useState } from "react";
import { 
    Avatar, AvatarBadge, Button, useToast, Drawer, DrawerBody, DrawerCloseButton, 
    DrawerContent, DrawerHeader, DrawerOverlay, Flex, FormControl, FormLabel, 
    Input, Textarea, useDisclosure, 
    Select
} from "@chakra-ui/react";
import imageCompression from 'browser-image-compression';
import { AddIcon, CalendarIcon, CheckIcon, EditIcon } from "@chakra-ui/icons";
import axios from "axios";
import AddDuration from "./Add_Duration";
import SelectDuration from "./Select_Duration";

const AddNewCourse = ({isDisabled, onClose, onRefresh}) => {
    const [coursePicture, setCoursePicture] = useState(null);
    const [courseName, setCourseName] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [years, setYears] = useState('');
    const [semesters, setSemesters] = useState('');
    const [programme, setProgramme] =useState('');
    
    const { isOpen: isOpenSelectDuration, onOpen: onOpenSelectDuration, onClose: onCloseSelectDuration } = useDisclosure();
    const { isOpen: isOpenAddDuration, onOpen: onOpenAddDuration, onClose: onCloseAddDuration } = useDisclosure();
    const toast = useToast();

    const handleDurationClose = () => {
        onCloseSelectDuration();
        onCloseAddDuration();
    }

    const handleDelete = (id, year, semester) => {
        setSubjects(prevSubjects => prevSubjects.map(subject => {
            if (subject.year === year && subject.semester === semester) {
                return {
                    ...subject,
                    subjects: subject.subjects.filter(sub => sub.id !== id)
                };
            }
            return subject;
        }));
    };
    
    const handleSubjectInput = (selectedSubjects, year, semester) => {
        setSubjects(prevSubjects => {
            const existingEntryIndex = prevSubjects.findIndex(entry => entry.year === year && entry.semester === semester);
            
            if (existingEntryIndex > -1) {
                // Update existing entry
                return prevSubjects.map((entry, index) => 
                    index === existingEntryIndex ? {
                        year: year,
                        semester: semester,
                        subjects: selectedSubjects
                    } : entry
                );
            } else {
                // Add new entry
                return [...prevSubjects, {
                    year: year,
                    semester: semester,
                    subjects: selectedSubjects
                }];
            }
        });
    };
    
    
    const handleDurationInput = (years,semesters) => {
        setYears(years);
        setSemesters(semesters);
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
                    setCoursePicture(reader.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Failed to compress the image.',
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        }
    };

    
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await axios.post('/add-new-course', {
                courseCode,
                courseName,
                coursePicture,
                courseDescription,
                subjects,
                years,
                semesters,
                programme
            });
            toast({
                title: 'Success',
                position: 'top-right',
                description: 'Course added successfully.',
                status: 'success',
                duration: 1000,
                isClosable: true,
            });
            onRefresh();
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: error.response?.data?.error || 'An error occurred while assigning subjects.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Flex padding='20px'>
            <FormControl>
                <Flex justifyContent='center'>
                    <Avatar
                        size="2xl"
                        src={
                            coursePicture ||
                            'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'
                        }
                    >
                        <AvatarBadge bg={'white'} boxSize="1.25em">
                            <label
                                htmlFor="profilePictureInput"
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <EditIcon boxSize="0.6em" color={'black'} />
                            </label>
                            <Input
                                name="profile_picture"
                                id="profilePictureInput"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicture}
                                style={{ display: 'none' }}
                            />
                        </AvatarBadge>
                    </Avatar>
                </Flex>
                <Flex justifyContent='space-between'mt='10px'>  
                    <FormLabel>Enter Course Code:</FormLabel>
                    <FormLabel>Select a Programme:</FormLabel>
                </Flex>
                <Flex justifyContent='space-between'>
                    <Input width='45%' onChange={(e) => setCourseCode(e.target.value)} placeholder="Enter Course Code..." required/>
                    <Select width='45%' onChange={(e)=>{setProgramme(e.target.value)}} required>
                        <option value=''>Select a programme</option>
                        <option value='Foundation'>Foundation</option>
                        <option value='Bachelor'>Bachelor</option>
                        <option value='Diploma'>Diploma</option>
                        <option value='Master'>Master</option>
                        <option value='Phd'>Phd</option>
                    </Select>
                </Flex>
                <FormLabel mt='10px'>Enter Course Name:</FormLabel>
                <Input onChange={(e) => setCourseName(e.target.value)} placeholder="Enter Course Name..." required/>
                <FormLabel mt='10px'>Enter Course Description:</FormLabel>
                <Textarea onChange={(e) => setCourseDescription(e.target.value)} resize='none' placeholder="Enter Course Description..." required/>
                <Flex mt='10px' justifyContent='space-between'>
                    <Button onClick={onOpenAddDuration} leftIcon={<CalendarIcon />} colorScheme="teal"  width='30%'>Add Duration</Button>
                    <Button onClick={onOpenSelectDuration} width='30%' leftIcon={<AddIcon />} colorScheme="teal">Add Subject</Button>
                    <Button 
                        width='30%'
                        leftIcon={<CheckIcon />} 
                        colorScheme="teal" 
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                    >
                        Save
                    </Button>
                </Flex>
            </FormControl>
            
            <Drawer placement="right" isOpen={isOpenAddDuration} onClose={handleDurationClose}>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Add Duration</DrawerHeader>
                    <DrawerBody>  
                        <AddDuration isDisabled={isDisabled} assignedYear={years} assignedSemester={semesters} onCloseSelf={onCloseAddDuration} onClose={handleDurationClose} handleDuration={handleDurationInput}/>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <Drawer size='full' placement="bottom" isOpen={isOpenSelectDuration} onClose={onCloseSelectDuration}>
                <DrawerOverlay />
                <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Select Duration</DrawerHeader>
                <DrawerBody>
                    <SelectDuration subjects={subjects} handleDelete={handleDelete} isDisabled={isDisabled} selectedSubjects={subjects} onOpenDuration={onOpenAddDuration} assignedYear={years} assignedSemester={semesters} onCloseSelf={onCloseSelectDuration} handleSubject={handleSubjectInput}/>
                </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Flex>
    );
};

export default AddNewCourse;
