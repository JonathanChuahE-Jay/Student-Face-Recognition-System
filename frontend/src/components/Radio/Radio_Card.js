import React from 'react';
import { Box, useRadio } from '@chakra-ui/react';

const RadioCard = (props) => {
    const { getInputProps, getRadioProps } = useRadio(props);
    const input = getInputProps();
    const radio = getRadioProps();

    return (
        <Box as='label'>
            <input {...input} hidden />
            <Box
                {...radio}
                cursor='pointer'
                borderWidth='1px'
                borderRadius='md'
                boxShadow='md'
                _checked={{
                    bg: 'teal.600',
                    color: 'white',
                    borderColor: 'teal.600',
                }}
                px={5}
                py={1}
                textAlign='center'
                aria-label={props['aria-label']}
            >
                {props.children}
            </Box>
        </Box>
    );
};

export default RadioCard;
