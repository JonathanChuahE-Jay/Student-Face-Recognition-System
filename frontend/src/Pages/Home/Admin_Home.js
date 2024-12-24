import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import axios from 'axios';

const DailyReport = React.lazy(() => import('../../components/Report/Daily_Report'));

const MotionBox = motion(Box);

const AdminHome = ({searchQuery}) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    topSubjects: { currentWeek: 'Null', previousWeek: 'Null' },
    bottomSubjects: { currentWeek: 'Null', previousWeek: 'Null' },
    attendancePercentage: { currentWeek: '0%', previousWeek: '0%' },
  });
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const statBgColor = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/display-admin-home-stats');
        setStats({
          attendancePercentage: {
            currentWeek: `${data.attendance.currentWeekPercentage}%`,
            previousWeek: `${data.attendance.previousWeekPercentage}%`,
          },
          totalStudents: data.totalStudents,
          topSubjects: {
            currentWeek: data.topSubjects.currentWeek,
            previousWeek: data.topSubjects.previousWeek,
          },
          bottomSubjects: {
            currentWeek: data.bottomSubjects.currentWeek,
            previousWeek: data.bottomSubjects.previousWeek,
          },
        });
      } catch (error) {
        console.error('Error fetching stats', error);
      }
    };

    fetchStats();
  }, []);

  // Memoizing statsData so it's only recalculated when stats change
  const statsData = useMemo(() => [
    { label: 'Total Students', value: stats.totalStudents, trend: '' },
    { label: 'Top Attending Subject (This Week)', value: stats.topSubjects.currentWeek, trend: '' },
    { label: 'Bottom Attending Subject (This Week)', value: stats.bottomSubjects.currentWeek, trend: '' },
    {
      label: 'Attendance Percentage (This Week)',
      value: stats.attendancePercentage.currentWeek,
      trend: stats.attendancePercentage.currentWeek >= stats.attendancePercentage.previousWeek ? 'increase' : 'decrease',
    },
  ], [stats]);

  return (
    <>
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="100vh"
        p={5}
        bg={bgColor}
      >
        <MotionBox
          mb={8}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Heading as="h1" size="xl" textAlign="center">
            Attendance Management Dashboard
          </Heading>
          <Box textAlign="center" color="gray.500">
            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </Box>
        </MotionBox>
        <Flex padding='10px 70px'>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={8}>
            {statsData.map((stat, index) => (
              <MotionBox
                key={index}
                p={4}
                bg={statBgColor}
                borderRadius="md"
                shadow="md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Stat>
                  <StatLabel>{stat.label}</StatLabel>
                  <StatNumber>{stat.value}</StatNumber>
                  <StatHelpText>
                    {stat.trend === 'increase' || stat.trend === 'decrease' ? (
                      <>
                        <StatArrow type={stat.trend} />
                        {stat.trend === 'increase'
                          ? 'Increased from last week'
                          : 'Decreased from last week'}
                      </>
                    ) : (
                      format(new Date(), 'MMM dd, yyyy')
                    )}
                  </StatHelpText>
                </Stat>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Flex>

        <React.Suspense fallback={<div>Loading Daily Report...</div>}>
          <DailyReport searchQuery={searchQuery}/>
        </React.Suspense>
      </Flex>
    </>
  );
};

export default AdminHome;
