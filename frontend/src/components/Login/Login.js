import React, { useEffect, useState } from "react";
import {
    Button,
    InputRightElement,
    Center,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    Stack,
    Flex,
    useToast,
    Link
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie"; 

const Login = ({ loadUser, logoutUser }) => {
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleShowPassword = () => setShowPassword(!showPassword);
    
    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/login", {
                email: loginEmail,
                password: loginPassword,
            });

            const user = response.data;

            setLoading(false);
            if (user.id) {
                const userDetails = {
                    user_id: user.user_id,
                    role: user.role,
                };
                
                Cookies.set("user", JSON.stringify(userDetails), { path: '' });

                loadUser(user);
                toast({
                    title: "Login successful",
                    position: "top-right",
                    description: `Welcome back ${user.name}!`,
                    status: "success",
                    duration: 1000,
                    isClosable: true,
                });
                navigate("/");
            } else {
                toast({
                    title: "Invalid credentials",
                    position: "top-right",
                    description: "Email or password are incorrect",
                    status: "error",
                    duration: 1000,
                    isClosable: true,
                });
            }
        } catch (error) {
            setLoading(false);
            toast({
                title: "Error occurred",
                position: "top-right",
                description: error.response?.data?.message || "Something went wrong. Please try again.",
                status: "error",
                duration: 1000,
                isClosable: true,
            });
        }
    };

    useEffect(()=>{
        setTimeout(() => {
            logoutUser();
        },500);
    },[loadUser])
    
    return (
        <Center height="90vh">
            <Stack
                height="50%"
                width="50%"
                padding="20px"
                borderRadius="20px"
                boxShadow="rgba(0, 0, 0, 0.35) 0px 5px 15px"
            >
                <FormControl>
                    <FormLabel>Email:</FormLabel>
                    <Input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email"
                    />
                    <FormLabel>Password:</FormLabel>
                    <InputGroup>
                        <Input
                            value={loginPassword}
                            type={showPassword ? "text" : "password"}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                        <InputRightElement width="3.5rem">
                            <Button h="1.75rem" size="md" onClick={handleShowPassword}>
                                {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                    <Link href="/forgot-password">Forgot password?</Link>
                    <Flex justifyContent="space-between" marginTop="20px">
                        <Button onClick={() => navigate("/register")}>Sign up</Button>
                        <Button isLoading={loading} onClick={handleLogin} isDisabled={loading}>
                            Log in
                        </Button>
                    </Flex>
                </FormControl>
            </Stack>
        </Center>
    );
};

export default Login;
