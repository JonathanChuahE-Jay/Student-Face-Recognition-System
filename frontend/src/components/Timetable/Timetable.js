import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useColorModeValue } from '@chakra-ui/react';

const localizer = momentLocalizer(moment);

const Timetable = ({ subjects, lecturer }) => {
    // Convert subjects object to an array
    const subjectsArray = Array.isArray(subjects) ? subjects : Object.values(subjects);

    // Generate calendar events for each week indefinitely
    const events = subjectsArray.flatMap(subject => {
        return subject.sections.flatMap(section => {
            return section.day.flatMap((day, index) => {
                // Skip events with "N/A" days or invalid times
                if (day === "N/A" || section.time[index].start_time === "00:00:00" || section.time[index].end_time === "00:00:00") {
                    return []; 
                }

                const dayIndex = moment().day(day).day();

                const startTime = section.time[index].start_time.split(":");
                const endTime = section.time[index].end_time.split(":");

                const startOfWeek = moment().startOf('week');

                // Generate events for the next few years (for example, 5 years)
                return Array.from({ length: 52 * 5 }).map((_, weekOffset) => {
                    const start = startOfWeek.clone().add(weekOffset, 'weeks').day(dayIndex).set({
                        hour: startTime[0],
                        minute: startTime[1],
                    }).toDate();

                    const end = startOfWeek.clone().add(weekOffset, 'weeks').day(dayIndex).set({
                        hour: endTime[0],
                        minute: endTime[1],
                    }).toDate();

                    const title = `${subject.name} (Section ${section.section})`;
                    const resource = { subject, section, lecturer, venue: section.venue[index] };

                    return {
                        title,
                        start,
                        end,
                        resource
                    };
                });
            });
        });
    });

    // Define colors for light and dark modes
    const calendarBackgroundColor = useColorModeValue('white', 'gray.900');
    const eventBackgroundColor = useColorModeValue('blue.500', 'blue.600'); 
    const eventTextColor = useColorModeValue('white', 'white');
    const textColor = useColorModeValue('black', 'white');  
    const borderColor = useColorModeValue('gray.200', 'gray.700'); 

    return (
        <div style={{ height: '500px', backgroundColor: calendarBackgroundColor, border: `1px solid ${borderColor}` }}>
            {events.length > 0 ? (
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%', backgroundColor: calendarBackgroundColor, color: textColor }}
                    eventPropGetter={(event) => ({
                        style: {
                            backgroundColor: eventBackgroundColor,
                            color: eventTextColor,
                            borderRadius: '8px', 
                            padding: '4px',  
                            border: `1px solid ${borderColor}` 
                        }
                    })}
                />
            ) : (
                <p style={{ color: textColor }}>No timetable data available.</p>
            )}
        </div>
    );
};

export default Timetable;
