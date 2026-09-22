import React from 'react';
import ImageListItem from '@mui/material/ImageListItem';

const ImageField = ({ label, sublabel, src, size = 'medium', align = 'center' }) => {
  const imageStyles = {
    width: size === 'small' ? '100px' : size === 'large' ? '300px' : '200px',
    display: 'block',
    marginLeft: align === 'center' ? 'auto' : align === 'right' ? 'auto' : '0',
    marginRight: align === 'center' ? 'auto' : align === 'left' ? 'auto' : '0',
  };

  const resolvedSrc =
    src && !src.startsWith('http') && !src.startsWith('/') ? `/${src}` : src;

  return (
    <div>
      <ImageListItem>
        <img
          src={resolvedSrc}
          title={label}
          alt={sublabel || label}
          loading="lazy"
          style={imageStyles}
        />
      </ImageListItem>
    </div>
  );
};

export default ImageField;
