import React from "react";
import { 
  Flex, useColorModeValue, Button, 
  useDisclosure, Drawer, DrawerOverlay, DrawerHeader, 
  DrawerCloseButton, DrawerContent, DrawerBody, Tooltip, 
  IconButton, Image
} from "@chakra-ui/react";
import logo from "../../Assets/Gif/wolf.gif";
import ProfileAvatar from "./Profile_Avatar";
import Search from "./Search";
import { HamburgerIcon } from "@chakra-ui/icons";
import { NavLink } from "react-router-dom";

const NavLinkButton = ({ to, label, icon, onClick }) => (
  <NavLink to={to} style={{ textDecoration: 'none' }} onClick={onClick}>
    <Button variant="ghost" justifyContent="flex-start" width="100%" leftIcon={icon}>
      {label}
    </Button>
  </NavLink>
);

const RoleBasedNavigation = ({ links, onCloseSideNavigation }) => (
  <>
    {links.map(({ path, label, icon }) => (
      <NavLinkButton 
        key={path} 
        to={path} 
        label={label} 
        icon={icon} 
        onClick={onCloseSideNavigation} 
      />
    ))}
  </>
);

const Navigation = ({ links, isMobile, isSignedIn, user, onLogout, searchQuery, setSearchQuery }) => {
  const { isOpen: isOpenSideNavigation, onOpen: onOpenSideNavigation, onClose: onCloseSideNavigation } = useDisclosure();
  
  const headerBgColor = useColorModeValue('white', 'gray.800');
  const headerWidth = !isSignedIn ? '100%' : isMobile ? "100%" : "calc(100% - 60px)";

  return (
    <Flex
      zIndex={1}
      boxShadow="md"
      as="header"
      position="fixed"
      top="0"
      right="0"
      left={!isSignedIn ? '0' : isMobile ? "0" : "60px"}
      width={headerWidth}
      padding="7px"
      alignItems="center"
      bg={headerBgColor}
    >
      {!isSignedIn ? (
        <b>Welcome to SFRAS</b>
      ) : isMobile && user ? (
        <>
          <IconButton 
            bg="transparent" 
            cursor="pointer" 
            mr={4} 
            onClick={onOpenSideNavigation} 
            icon={<HamburgerIcon boxSize={8} />} 
          />
          <Search searchData={searchQuery} handleSearchBar={setSearchQuery} isDisabled={false} />
        </>
      ) : 
        <Search searchData={searchQuery} handleSearchBar={setSearchQuery} isDisabled={false} />
      }

      <Flex ml="auto" alignItems="center">
        {isSignedIn ? (
          <ProfileAvatar onLogout={onLogout} isSignedIn={isSignedIn} user={user} />
        ) : (
          <NavLink to="/login">
            <ProfileAvatar isSignedIn={isSignedIn} />
          </NavLink>
        )}
      </Flex>

      {user && (
        <Drawer isOpen={isOpenSideNavigation} onClose={onCloseSideNavigation} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader display="flex" justifyContent="space-between" alignItems="center">
              <Image src={logo} alt="Logo" height="40px" />
              <Tooltip label="Close Menu" fontSize="md">
                <DrawerCloseButton />
              </Tooltip>
            </DrawerHeader>
            <DrawerBody p={4}>
              <Flex direction="column" spacing={4}>
                <RoleBasedNavigation links={links} onCloseSideNavigation={onCloseSideNavigation} />
              </Flex>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </Flex>
  );
};

export default Navigation;
