import React, { useState } from "react";
import { Box, Flex, Grid, GridItem, Heading, Spinner, Text, useBreakpointValue } from "@chakra-ui/react";
import Calendar from "react-calendar";
import Lecturer_Daily_Report from '../../components/Report/Lecturer_Daily_Report';
import { Chart } from "react-google-charts";
import moment from 'moment-timezone';
import axios from "axios";
import { useEffect } from "react";

const LecturerHome = ({ user, searchQuery }) => {
    const [subjects] = useState(user.subjectsData ? user.subjectsData : []);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [counts, setCounts] = useState({ Present: 0, Absent: 0, Excused: 0 });
    const [weeklyData, setWeeklyData] = useState([]);
    const [weekRange, setWeekRange] = useState({});
    const calendarColSpan = useBreakpointValue({ base: 4, md: 1 });
    const itemColSpan = useBreakpointValue({ base: 4, md: 3, lg: 3 });
    const [loading, setLoading] = useState(false);

    const attendanceData = [

        ["Status", "Number of Students"],
        ["Attended", counts.Present],
        ["Absence", counts.Absent],
        ["Excused", counts.Excused],
    ];

    const chartOptions = {
        title: "Daily Attendance Report",
        pieHole: 0.4,
        is3D: false,
    };

    const formatWeeklyDataForChart = () => {
        if (!Array.isArray(weeklyData)) {
            console.error("Weekly data is not an array:", weeklyData);
            return [];
        }

        const chartData = [
            ["Subject", "Present", "Absent", "Excused"]
        ];

        weeklyData.forEach((entry) => {
            chartData.push([
                `${entry.subject_name}`,
                entry.Present || 0,
                entry.Absent || 0,
                entry.Excused || 0,
            ]);
        });

        return chartData;
    };

    const weeklyChartOptions = {
        title: "Weekly Attendance Report",
        chartArea: { width: "50%" },
        hAxis: {
            title: "Attendance Count",
            minValue: 0
        },
        vAxis: {
            title: "Section"
        },
        isStacked: true,
    };

    const fetchData = async () => {
        setLoading(true);
        const subjectsAndSections = user.subjectsData.map(subject => ({
            subject_id: subject.subject_id,
            subject_section: subject.subject_section,
        }));

        try {
            const localDate = moment(selectedDate).tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD');
            const response = await axios.post("http://localhost:5000/display-daily-report", { date: localDate, subjectsAndSections });

            const reportData = response.data.result;

            const lecturerSubjects = user.subjectsData || [];

            const filteredReportData = reportData?.filter((d) =>
                lecturerSubjects.some((subject) =>
                    subject.subject_id === d.subject_id && subject.subject_section === d.section_number
                )
            ) || [];

            const weeklyDataResponse = await axios.post("/lecturer-home-stats", { date: localDate, subjectsAndSections });

            const weeklyReport = weeklyDataResponse.data.weeklyReport;

            if (Array.isArray(weeklyReport)) {
                setWeeklyData(weeklyReport);
            } else {
                console.error("weeklyReport is not an array:", weeklyReport);
                setWeeklyData([]);
            }
            const weekRange = response.data.weekRange;

            setWeekRange(weekRange);

            const presentCount = filteredReportData.filter((d) => d.status === "Present").length || 0;
            const absentCount = filteredReportData.filter((d) => d.status === "Absent").length || 0;
            const excusedCount = filteredReportData.filter((d) => d.status === "Excused").length || 0;

            setCounts({ Present: presentCount, Absent: absentCount, Excused: excusedCount });
        } catch (error) {
            console.error("Error fetching report:", error);
            setCounts({ Present: 0, Absent: 0, Excused: 0 });
        } finally {
            setLoading(false);
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

    const getBorderColor = (startTime, endTime, day) => {
        const now = new Date();
        const today = now.toLocaleString("en-US", { weekday: "long" });

        const start = combineDateWithTime(startTime).getTime();
        const end = combineDateWithTime(endTime).getTime();
        const nowTime = now.getTime();

        if (today === day) {
            if (nowTime >= start && nowTime <= end) {
                return "yellow.500";
            } else if (nowTime < start) {
                return "green.500";
            } else {
                return "red.500";
            }
        } else {
            return "gray.500";
        }
    };


    return (
        <Grid padding={3} gap={5} templateColumns="repeat(4, 1fr)" width='100%'>
            {/* Statistics Section */}
            {
                loading ? (
                    <Flex
                        justifyContent="center"
                        alignItems="center"
                        position="absolute"
                        top={0}
                        left={0}
                        width="100%"
                        height="100vh"
                        flexDirection='column'
                    >
                        loading
                        <Spinner size="lg" />
                    </Flex>
                ) : (
                    <>
                        <GridItem
                            borderRadius={5}
                            colSpan={itemColSpan}
                            bg="gray.50"
                            padding={3}
                            rowSpan={1}
                            display="flex"
                            justifyContent='center'
                            flexDirection='column'
                        >
                            <Grid gap={5} templateColumns="repeat(2, 1fr)" overflowY="scroll">
                                <GridItem colSpan={1}>
                                    <Box maxHeight="350px">
                                        <Chart
                                            chartType="PieChart"
                                            data={attendanceData}
                                            options={chartOptions}
                                            height="100%"
                                        />
                                    </Box>
                                </GridItem>

                                <GridItem colSpan={1}>
                                    <Box maxHeight="350px">
                                        <Chart
                                            chartType="BarChart"
                                            data={formatWeeklyDataForChart()}
                                            options={weeklyChartOptions}
                                            height="100%"
                                        />
                                    </Box>
                                </GridItem>
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
                                            borderColor={getBorderColor(subject.start_time, subject.end_time, subject.day)}
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
                            <Lecturer_Daily_Report searchQuery={searchQuery} date={selectedDate} user={user} />
                        </GridItem>
                    </>
                )}
        </Grid>
    );
};

export default LecturerHome;
