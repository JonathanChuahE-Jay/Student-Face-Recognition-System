import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Heading,
  Stack,
  Flex,
  useColorModeValue,
  Badge,
  Icon,
  VStack,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import axios from "axios";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { FaCheckCircle, FaTimesCircle, FaClock, FaHourglassStart, FaStopCircle } from "react-icons/fa";

const StudentHome = ({ searchQuery, user }) => {
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState(user.subjectsData);
  const [filteredClasses, setFilteredClasses] = useState(upcomingClasses);
  const [filteredAttendances, setFilteredAttendances] = useState(recentAttendances);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post("/show-attendances", { student_id: user?.id });
        setRecentAttendances(response.data.studentAttendance || []);
        setFilteredAttendances(response.data.studentAttendance || []);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery?.toLowerCase() || "";

    const filtered = upcomingClasses.filter((classItem) =>
      classItem.subject_name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredClasses(filtered);

    const filteredAttendance = recentAttendances.filter((attendance) =>
      attendance.subject_name.toLowerCase().includes(lowerCaseQuery) ||
      attendance.status.toLowerCase().includes(lowerCaseQuery),
    );
    setFilteredAttendances(filteredAttendance);
  }, [searchQuery, upcomingClasses, recentAttendances]);

  const convertToMYRTime = (dateString) => {
    const timeZone = "Asia/Kuala_Lumpur";
    const zonedDate = toZonedTime(dateString, timeZone);
    return format(zonedDate, "yyyy-MM-dd hh:mm:ss a");
  };

  const getClassStatus = (startTime, endTime) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const startClassTime = startHour * 60 + startMinute;
    const endClassTime = endHour * 60 + endMinute;

    if (currentTime < startClassTime) {
      return "starting_in";
    } else if (currentTime >= startClassTime && currentTime <= endClassTime) {
      return "ongoing";
    } else {
      return "ended";
    }
  };

  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Box p={5}>
      <Heading mb={5} color="teal.500">
        Welcome, {user?.name || "Student"}!
      </Heading>

      {/* Attendance Section */}
      <Grid templateColumns="repeat(4, 1fr)" gap={6}>
        <GridItem colSpan={4}>
          <Box bg={cardBg} p={5} rounded="lg" shadow="md">
            <Heading size="md" mb={3} color="blue.600">
              Recent Attendance
            </Heading>

            <Stack spacing={4}>
              {filteredAttendances.length > 0 ? (
                filteredAttendances.map((attendance, index) => (
                  <Flex key={index} justify="space-between" p={4} rounded="md" bg="gray.100">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">{attendance.subject_name || "Unknown"}</Text>
                      <Text fontSize="sm" color="gray.500">{convertToMYRTime(attendance.date)}</Text>
                    </VStack>
                    <Flex direction="column" align="center">
                      <Badge
                        colorScheme={attendance.status === "Present" ? "green" : "red"}
                        mb={2}
                      >
                        {attendance.status}
                      </Badge>
                      <Icon
                        as={attendance.status === "Present" ? FaCheckCircle : FaTimesCircle}
                        boxSize={6}
                        color={attendance.status === "Present" ? "green.500" : "red.500"}
                      />
                    </Flex>
                  </Flex>
                ))
              ) : (
                <Text>No recent attendance records found.</Text>
              )}
            </Stack>
          </Box>
        </GridItem>
      </Grid>

      {/* Upcoming Classes Section */}
      <Grid templateColumns="repeat(4, 1fr)" gap={6}>
        <GridItem colSpan={4}>
          <Box bg={cardBg} p={5} rounded="lg" shadow="md">
            <Heading size="md" mb={3} color="blue.600">
              Upcoming Subjects
            </Heading>

            <Stack spacing={4}>
              {filteredClasses.length > 0 ? (
                filteredClasses.map((classes, index) => {
                  const classStatus = getClassStatus(classes.start_time, classes.end_time);
                  let bgColor;
                  let statusText;
                  let icon;

                  if (classStatus === "starting_in") {
                    bgColor = "green.50";
                    statusText = `Starting at ${classes.start_time}`;
                    icon = <Icon as={FaHourglassStart} boxSize={6} color="green.500" />;
                  } else if (classStatus === "ongoing") {
                    bgColor = "blue.50";
                    statusText = "Ongoing";
                    icon = <Icon as={FaClock} boxSize={6} color="blue.500" />;
                  } else {
                    bgColor = "red.50";
                    statusText = "Ended";
                    icon = <Icon as={FaStopCircle} boxSize={6} color="red.500" />;
                  }

                  return (
                    <Flex key={index} justify="space-between" p={4} rounded="md" bg={bgColor} boxShadow="sm">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{classes.subject_name || "Unknown"}</Text>
                        <Text fontSize="sm" color="gray.500">{classes.day}</Text>
                      </VStack>
                      <Flex direction="column" align="center">
                        <Text fontWeight="bold" fontSize="lg">{`${classes.start_time} - ${classes.end_time}`}</Text>
                        <Text fontSize="sm" color="gray.600">{classes.venue}</Text>
                      </Flex>
                      <Flex direction="column" align="center" justify="center">
                        {icon}
                        <Text fontSize="sm" color="blue.600">{statusText}</Text>
                      </Flex>
                    </Flex>
                  );
                })
              ) : (
                <Text>No upcoming classes found.</Text>
              )}
            </Stack>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default StudentHome;
