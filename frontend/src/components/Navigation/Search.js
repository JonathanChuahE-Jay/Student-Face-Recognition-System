import React from 'react';
import { Input, InputGroup, InputLeftElement, InputRightElement, CloseButton, Tooltip } from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';

const Search = ({ searchData, handleSearchBar, isDisabled }) => {
  const handleChange = (e) => {
    handleSearchBar(e.target.value);
  };

  const clearSearch = () => {
    handleSearchBar('');
  };

  return (
    <InputGroup width='40%' ml='10px'>
      <Input
        variant='flushed'
        placeholder='Search'
        value={searchData}
        onChange={handleChange}
        isDisabled={isDisabled}
      />
      <InputLeftElement>
        <Search2Icon />
      </InputLeftElement>
      <InputRightElement>
        <Tooltip isDisabled={isDisabled} label='Clear Search Bar' fontSize='md'>
          <CloseButton onClick={clearSearch} />
        </Tooltip>
      </InputRightElement>
    </InputGroup>
  );
};

export default Search;
