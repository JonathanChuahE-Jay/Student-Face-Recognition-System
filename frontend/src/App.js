import React, { useState, useEffect, useCallback, useContext } from "react";
import { Routes, Route, Navigate} from "react-router-dom";
import { Box, Flex, Spinner, useBreakpointValue} from "@chakra-ui/react";
import Navigation from "./components/Navigation/Navigation";
import SideNavigation from "./components/Navigation/Side_Navigation";
import Login from "./components/Login/Login";
import StudentHome from "./Pages/Home/Student_Home";
import Register from "./components/Register/Register";
import AdminHome from "./Pages/Home/Admin_Home";
import ForgotPassword from "./components/ForgotPassword/Forgot_Password";
import ShowAllSubject from "./components/Subject/Subject_Management";
import StudentManagement from './components/Students/Students_Management';
import LecturerManagement from './components/Lecturers/Lecturer_Management';
import Student_Profile from "./components/Students/Student_Profile";
import ShowAttendance from "./components/Attendance/Show_Attendance";
import CourseManagement from "./components/Course/Course_Management";
import SubjectInfo from "./components/Subject/Subject_Info";
import DailyReport from "./components/Report/Daily_Report";
import Settings from "./components/Profile/Settings";
import MyAccount from "./components/Profile/My_Account";
import Cookies from "js-cookie";
import axios from "axios";
import { AppProvider, AppContext } from "./Context/AppProvider";
import LecturerHome from "./Pages/Home/Lecturer_Home";
import FaceRecognition from "./components/FaceRecognition/Face_Recognition";
import { FaHome, FaBook, FaClipboardList, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { MdInsertDriveFile } from "react-icons/md";
import Gate from "./Context/GateProvider";


const ICON_SIZE = { large: "25px", medium: "20px" };

const roleBasedLinks = {
  admin: [
    { path: "/", label: "Home", icon: <FaHome fontSize={ICON_SIZE.large} /> },
    { path: "/course-management/page/1", label: "Course Management", icon: <FaBook fontSize={ICON_SIZE.medium} /> },
    { path: "/subject-management/page/1", label: "Subject Management", icon: <FaClipboardList fontSize={ICON_SIZE.medium} /> },
    { path: "/student-management/page/1", label: "Student Management", icon: <FaUserGraduate fontSize={ICON_SIZE.medium} /> },
    { path: "/lecturer-management/page/1", label: "Lecturer Management", icon: <FaChalkboardTeacher fontSize={ICON_SIZE.large} /> },
    { path: "/report", label: "Report", icon: <MdInsertDriveFile fontSize={ICON_SIZE.medium} /> }
  ],
  lecturer: [
    { path: "/", label: "Home", icon: <FaHome fontSize={ICON_SIZE.large} /> },
    { path: "/subject-management/page/1", label: "Subject Management", icon: <FaClipboardList fontSize={ICON_SIZE.medium} /> },
    { path: "/student-management/page/1", label: "Student Management", icon: <FaUserGraduate fontSize={ICON_SIZE.medium} /> },
  ]
};

const initialUser = {
  id: '',
  name: '',
  current_id: '',
  user_id: '',
  email: '',
  joined_date: '',
  profile_picture: '',
  role: '',
  subjectsData: []
};

const App = () => {
  const userCookie = Cookies.get("user");
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user, setUser, isSignedIn, setIsSignedIn, loading, setLoading } = useContext(AppContext); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const loadUser = useCallback((data) => {
    const userCookieData = {
      id: data.id,
      current_id: data.current_id,
      name: data.name,
      email: data.email,
      user_id: data.user_id,
      joined_date: data.joined_date,
      profile_picture: data.profile_picture,
      role: data.role,
    };
  
    setUser({
      ...userCookieData,
      subjectsData: data.subjectsData || [],
    });
  
    Cookies.set("user", JSON.stringify(userCookieData), {
      expires: 7,
      secure: false, 
      sameSite: "Strict",
    });
  
    setIsSignedIn(true);
    setLoading(false);
  }, []);

  const logoutUser = useCallback(() => {
    Cookies.remove("user");
    setUser(initialUser);
    setIsSignedIn(false);
    setLoading(false);
  }, []);

  const fetchUser = async () => {
    if (userCookie) {
      try {
        const parsedUserCookie = JSON.parse(userCookie);
        const response = await axios.post(`/show-user`, { user: parsedUserCookie, currentDate });
        
        if (response.data) {
          loadUser(response.data);
        } else {
          logoutUser();
          setLoading(false); 
        }
      } catch (error) {
        console.error("Error loading user:", error);
        Cookies.remove("user"); 
        setLoading(false); 
      }
    } else {
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (userCookie) {
      fetchUser();
    } else {
      Cookies.remove("user"); 
      setLoading(false);
    }
  }, [userCookie]);

  useEffect(()=>{
    fetchUser();
  },[currentDate])

  const handleSearchChange = (query) => setSearchQuery(query);

  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    let interval;
  
    if (!loading) {
      interval = setInterval(() => {
        axios
          .get('/auto-update-attendance')
          .catch(error => {
            console.log(error);
          });
    
        axios
          .get('/auto-session-logs')
          .catch(error => {
            console.log(error);
          });
      }, 2000);
    }
    
  
    return () => clearInterval(interval);
  }, [loading]);
  
  if (loading) {
    return (
      <Flex justifyContent="center" h="100vh" alignItems="center" flexDirection="column">
        Loading...<Spinner />
      </Flex>
    );
  }

  return (
    <AppProvider>
      <Flex height="100vh">
        {!isMobile && isSignedIn && user.role ? (
          <Box>
            <SideNavigation links={roleBasedLinks[user.role] || []} role={user.role} />
          </Box>
        ) : null}
        <Flex flexDirection="column" flex="1" marginLeft={isMobile ? "0" : "60px"}>
          <Navigation
            links={roleBasedLinks[user.role]}
            isMobile={isMobile}
            isSignedIn={isSignedIn}
            user={user}
            onLogout={logoutUser}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
          />
          <Box as="main" flex="1" marginTop="62px" overflowY="auto">
            <Routes>
              <Route
                path="/"
                element={
                  isSignedIn ? (
                    <Gate role={user.role} allowedRoles={["admin", "lecturer", "student"]}>
                      {user.role === "admin" && <AdminHome searchQuery={searchQuery} />}
                      {user.role === "lecturer" && 
                        <LecturerHome
                          setCurrentDate={setCurrentDate}
                          fetchUser={fetchUser}
                          searchQuery={searchQuery}
                          user={user}
                        />
                      }
                      {user.role === "student" && <StudentHome searchQuery={searchQuery} />}
                    </Gate>
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/login"
                element={
                  <Login
                    logoutUser={logoutUser}
                    loadUser={loadUser}
                  />
                }
              />
              <Route
                path="/my-account"
                element={
                  <Gate role={user.role} allowedRoles={["admin", "lecturer", "student"]}>
                    <MyAccount onRefresh={fetchUser} />
                  </Gate>
                }
              />
              <Route
                path="/setting"
                element={
                  <Gate role={user.role} allowedRoles={["admin","lecturer","student"]}>
                    <Settings /> 
                  </Gate>
                }
              />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/course-management/page/:page"
                  element={
                    <Gate role={user.role} allowedRoles={["admin"]}>
                      <CourseManagement searchQuery={searchQuery} isMobile={isMobile} />
                    </Gate>
                  }
                />
              <Route
                path="/subject-management/page/:page"
                element={
                  <Gate role={user.role} allowedRoles={["admin", "lecturer"]}>
                    <ShowAllSubject user={user} searchQuery={searchQuery} />
                  </Gate>
                }
              />
              <Route
                path="/student-management/page/:page"
                element={
                  <Gate role={user.role} allowedRoles={["admin", "lecturer"]}>
                    <StudentManagement user={user} searchQuery={searchQuery} />
                  </Gate>
                }
              />
              <Route
                path="/lecturer-management/page/:page"
                element={
                  <Gate role={user.role} allowedRoles={["admin"]}>
                    <LecturerManagement searchQuery={searchQuery} isMobile={isMobile} />
                  </Gate>
                }
              />
              <Route
                path="/subject-info/show-attendance/:subject_name"
                element={
                  <Gate role={user.role} allowedRoles={["admin","lecturer"]}>
                    <ShowAttendance user={user} searchQuery={searchQuery} />
                  </Gate>
                }
              />
              <Route
                path="/student-management/student-profile/:student_name"
                element={
                  <Gate role={user.role} allowedRoles={["admin","lecturer"]}>
                    <Student_Profile user={user} searchQuery={searchQuery} /> 
                  </Gate>
                }
              />
              <Route
                path="/subject-info/:subject_name"
                element={
                  <Gate role={user.role} allowedRoles={["admin","lecturer"]}>
                    <SubjectInfo user={user} searchQuery={searchQuery} />
                  </Gate>
                }
              />
              <Route
                path="/report"
                element={
                  <Gate role={user.role} allowedRoles={["admin", "lecturer"]}>
                    <DailyReport searchQuery={searchQuery} />
                  </Gate>
                }
              />
              <Route
                path="/start-class"
                element={
                  <Gate role={user.role} allowedRoles={["lecturer","admin"]}>
                    <FaceRecognition searchQuery={searchQuery} isMobile={isMobile} user={user} />
                  </Gate>
                }
              />
            </Routes>
          </Box>
        </Flex>
      </Flex>
    </AppProvider>
  );
};

export default App;
