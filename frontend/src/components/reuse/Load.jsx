import React from 'react';
import { ThreeDot } from 'react-loading-indicators';

const Load = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <ThreeDot variant="brick-stack" color="#ea81b4" size="medium" text="" textColor="" />
    </div>
  );
};

export default Load;
