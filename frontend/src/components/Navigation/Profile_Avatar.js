import React from "react";
import { Avatar, Menu, MenuButton, MenuList, MenuGroup, MenuItem, MenuDivider, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const ProfileAvatar = ({ onLogout, isSignedIn, user }) => {
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    toast({
      title: 'Success',
      position: 'top-right',
      description: 'Successfully logged out.',
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
    onLogout(); 
    navigate('/login'); 
  };

  return (
    isSignedIn ? (
      <Menu>
        <MenuButton>
          <Avatar name={user.name} src={user.profile_picture} />
        </MenuButton>
        <MenuList>
          <MenuGroup title="Profile">
            <MenuItem onClick={() => navigate('/my-account', { state: { user } })}>My Account</MenuItem>
            <MenuItem onClick={() => navigate('/setting')}>Settings</MenuItem>
          </MenuGroup>
          <MenuDivider />
          <MenuGroup title="Help">
            <MenuItem>Docs</MenuItem>
            <MenuItem>FAQ</MenuItem>
          </MenuGroup>
          <MenuDivider />
          <MenuGroup>
            <MenuItem onClick={handleLogout}>Log out</MenuItem>
          </MenuGroup>
        </MenuList>
      </Menu>
    ) : (
      <Avatar name="Unknown" src="https://bit.ly/broken-link" />
    )
  );
};

export default ProfileAvatar;
