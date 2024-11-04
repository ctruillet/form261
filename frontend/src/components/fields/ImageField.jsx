import React from 'react';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';

const ImageField = ({ label, sublabel, src, size = 'medium', align = 'center' }) => {

    // Définition des styles en fonction des props size et align
    const imageStyles = {
        width: size === 'small' ? '100px' : size === 'large' ? '300px' : '200px',
        display: 'block',
        marginLeft: align === 'center' ? 'auto' : align === 'right' ? 'auto' : '0',
        marginRight: align === 'center' ? 'auto' : align === 'left' ? 'auto' : '0',
    };

    return (
        <div>
            {/* <ImageList> */}
                <ImageListItem>
                    <img
                        srcSet={src}
                        src={src}
						title={label}
                        alt={sublabel}
                        loading="lazy"
                        style={imageStyles}
                    />
                </ImageListItem>
            {/* </ImageList> */}
        </div>
    );
};

export default ImageField;
