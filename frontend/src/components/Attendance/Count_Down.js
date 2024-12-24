import React, { useState, useEffect } from 'react';
import { Box, Text, Flex, GridItem, Grid } from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

const Countdown = ({ userSubjectsData, selectedSection, sectionTime }) => {
    const [timesLeft, setTimesLeft] = useState([]);

    useEffect(() => {
        const calculateTimesLeft = () => {
            const now = new Date();
            const times = [];

            const filteredSections = userSubjectsData.length > 0
                ? sectionTime.filter(subject =>
                    userSubjectsData.some(userSubject => userSubject.subject_section === subject.section_number)
                )
                : sectionTime; 

            if (selectedSection === 'All' && filteredSections.length > 0) {
                filteredSections.forEach((time, index) => {
                    if (time.start_time && time.end_time) {
                        const [startHours, startMinutes, startSeconds] = time.start_time.split(':').map(Number);
                        const [endHours, endMinutes, endSeconds] = time.end_time.split(':').map(Number);
            
                        const startTime = new Date(now);
                        startTime.setHours(startHours, startMinutes, startSeconds, 0);
            
                        const endTime = new Date(now);
                        endTime.setHours(endHours, endMinutes, endSeconds, 0);
            
                        let diff;
                        if (now < startTime) {
                            diff = startTime - now;
                            times.push({ index, time: `Section ${time.section_number} Starts in ${formatTime(diff)}` });
                        } else if (now > endTime) {
                            times.push({ index, time: `Section ${time.section_number} class has ended.` });
                        } else {
                            diff = endTime - now;
                            times.push({ index, time: `Section ${time.section_number} Ends in ${formatTime(diff)}` });
                        }
                    }
                });
            }else if (selectedSection !== 'All' && sectionTime.length > 0) {
                const time = sectionTime[selectedSection - 1];
                if (time && time.start_time && time.end_time) {
                    const [startHours, startMinutes] = time.start_time.split(':').map(Number);
                    const [endHours, endMinutes] = time.end_time.split(':').map(Number);

                    const startTime = new Date(now);
                    startTime.setHours(startHours, startMinutes, 0, 0);

                    const endTime = new Date(now);
                    endTime.setHours(endHours, endMinutes, 0, 0);

                    let diff;
                    if (now < startTime) {
                        diff = startTime - now;
                        times.push({ time: `Starts in ${formatTime(diff)}` });
                    } else if (now > endTime) {
                        times.push({ time: 'The section has ended.' });
                    } else {
                        diff = endTime - now;
                        times.push({ time: `Ends in ${formatTime(diff)}` });
                    }
                }
            }

            setTimesLeft(times);
        };

        const formatTime = (diff) => {
            const totalSeconds = Math.floor(diff / 1000);
            const hoursLeft = Math.floor(totalSeconds / 3600);
            const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
            const secondsLeft = totalSeconds % 60;
            return `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
        };

        calculateTimesLeft();  

        const interval = setInterval(calculateTimesLeft, 1000);

        return () => clearInterval(interval);
    }, [selectedSection, sectionTime, userSubjectsData]);  

    return (
        <Box>
            {selectedSection === 'All' ? (
                <Box>
                    {timesLeft.length > 0 ? (
                        <Grid gap={2} templateColumns="repeat(2,1fr)">
                            {timesLeft.map((item, idx) => (
                                <GridItem display="flex" alignItems="center" justifyContent="center" key={idx} height="50px" fontSize="lg" boxShadow="md" fontWeight="bold">
                                    {item.time}
                                </GridItem>
                            ))}
                        </Grid>
                    ) : (
                        <Flex height="80px" justifyContent="center" alignItems="center" textAlign="center" flexDirection="column" mt={4}>
                            <InfoIcon boxSize={20} />
                            <Text mt={2} mb={4}>There's no existing time for this subject currently.</Text>
                        </Flex>
                    )}
                </Box>
            ) : (
                timesLeft.length > 0 ? (
                    <Flex minHeight="80px" alignItems="center" justifyContent="center">
                        <Text as="u" fontSize="lg" fontWeight="bold">
                            {timesLeft[0].time}
                        </Text>
                    </Flex>
                ) : (
                    <Flex minHeight="350px" alignItems="center" textAlign="center" flexDirection="column" mt={4}>
                        <InfoIcon boxSize={20} />
                        <Text mt={2} mb={4}>There's no existing time for this subject currently.</Text>
                    </Flex>
                )
            )}
        </Box>
    );
};

export default Countdown;
