import React, { useState } from "react";
import { Box, Grid, GridItem, Text, useBreakpointValue } from "@chakra-ui/react";
import Calendar from "react-calendar";
import Lecturer_Daily_Report from '../../components/Report/Lecturer_Daily_Report';
import { Chart } from "react-google-charts";
import moment from 'moment-timezone';
import axios from "axios";
import { useEffect } from "react";

const LecturerHome = ({ user, searchQuery }) => {
    const [subjects] = useState(user.subjectsData ? user.subjectsData : []);
    const [attendances, setAttendances] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date()); 
    const [counts, setCounts] = useState({ Present: 0, Absent: 0, Excused: 0 });

    const calendarColSpan = useBreakpointValue({ base: 4, md: 1 }); 
    const itemColSpan = useBreakpointValue({ base: 4, md: 3 });

    const attendanceData = [
        ["Status", "Number of Students"],
        ["Attended", counts.Present], 
        ["Absence", counts.Absent], 
        ["Excused", counts.Excused], 
    ];

    const chartOptions = {
        pieHole: 0.4,
        is3D: false,
    };

    const fetchData = async () => {
        const subjectsAndSections = user.subjectsData.map(subject => ({
            subject_id: subject.subject_id,
            subject_section: subject.subject_section,
        }));

        try {
            const localDate = moment(selectedDate).tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD');
            const response = await axios.post("http://localhost:5000/display-daily-report", { date:localDate, subjectsAndSections });
            const reportData = response.data.result;
            const subjectsWithSections = response.data.subjectsWithSectionsAndLecturers;

            const lecturerSubjects = user.subjectsData || [];

            const filteredReportData = reportData?.filter((d) =>
                lecturerSubjects.some((subject) =>
                    subject.subject_id === d.subject_id && subject.subject_section === d.section_number
                )
            ) || [];

            const filteredSubjects = subjectsWithSections?.map((subject) => {
                const filteredSections = subject.sections.filter((section) =>
                    lecturerSubjects.some((lecturerSubject) =>
                        lecturerSubject.subject_id === subject.id &&
                        lecturerSubject.subject_section === section.section_number
                    )
                );

                return filteredSections.length > 0 ? { ...subject, sections: filteredSections } : null;
            }).filter(Boolean) || [];

            setAttendances(filteredReportData);

            const presentCount = filteredReportData.filter((d) => d.status === "Present").length || 0;
            const absentCount = filteredReportData.filter((d) => d.status === "Absent").length || 0;
            const excusedCount = filteredReportData.filter((d) => d.status === "Excused").length || 0;

            setCounts({ Present: presentCount, Absent: absentCount, Excused: excusedCount });
        } catch (error) {
            console.error("Error fetching report:", error);
            setAttendances([]);
            setCounts({ Present: 0, Absent: 0, Excused: 0 });
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const combineDateWithTime = (time) => {
        const [hours, minutes, seconds] = time.split(":");
        return new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            hours,
            minutes,
            seconds
        );
    };

    const getBorderColor = (startTime, endTime) => {
        const now = new Date().getTime(); 
        const start = combineDateWithTime(startTime).getTime();
        const end = combineDateWithTime(endTime).getTime();

        if (now >= start && now <= end) {
            return "yellow.500"; 
        } else if (now < start) {
            return "green.500"; 
        } else {
            return "red.500"; 
        }
    };

    return (
        <Grid padding={3} gap={5} templateColumns="repeat(4, 1fr)">
            {/* Statistics Section */}
            <GridItem
                borderRadius={5}
                colSpan={itemColSpan}
                bg="gray.50"
                padding={3} 
                rowSpan={1}
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <Grid gap={5} templateColumns="repeat(2, 1fr)">
                    <Chart
                        chartType="PieChart"
                        width="100%"
                        data={attendanceData}
                        options={chartOptions}
                    />
                    <Chart
                        chartType="PieChart"
                        width="100%"
                        data={attendanceData}
                        options={chartOptions}
                    />
                </Grid>
               
            </GridItem>

            {/* Calendar Section */}
            <GridItem
                display="flex"
                flexDirection="column"
                justifyContent="center"
                padding={5}
                borderRadius={5}
                rowSpan={3}
                colSpan={calendarColSpan}
                bg="gray.50"
            >
                <Box width="100%">
                    <Calendar
                        value={selectedDate}
                        onChange={setSelectedDate} 
                    />
                </Box>
                <Text as="b" marginTop="10px">
                    Schedule for {selectedDate.toDateString()}
                </Text>
                <Grid marginTop="10px" gap={2} templateColumns="repeat(1, 1fr)">
                    {subjects && subjects.length > 0 ? (
                        subjects.map((subject, index) => (
                            <GridItem
                                key={index}
                                padding={2}
                                borderRadius={4}
                                boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
                                border="2px solid"
                                borderColor={getBorderColor(subject.start_time, subject.end_time)}
                            >
                                <Text>
                                    <b>{subject.subject_name}</b> (Section: {subject.subject_section})
                                </Text>
                                <Text>{`${subject.start_time} - ${subject.end_time}`}</Text>
                                <Text>{subject.venue ? `Venue: ${subject.venue}` : "Venue: Not Set"}</Text>
                            </GridItem>
                        ))
                    ) : (
                        <Text>No subjects available</Text>
                    )}
                </Grid>
            </GridItem>

            {/* Daily Report Section */}
            <GridItem borderRadius={5} overflow="scroll" colSpan={itemColSpan} bg="gray.50" rowSpan={2}>
                <Lecturer_Daily_Report searchQuery={searchQuery} date={selectedDate} user={user}/>
            </GridItem>
        </Grid>
    );
};

export default LecturerHome;
