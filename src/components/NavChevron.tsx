import React from 'react';
import Svg, { Path } from 'react-native-svg';

const NavChevron = ({ direction, size = 30 }: { direction: 'left' | 'right'; size?: number }) => {
  const d = direction === 'left' ? 'M8.8 4.8 L16.8 12 L8.8 19.2' : 'M15.2 4.8 L7.2 12 L15.2 19.2';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={d}
        stroke="#ffffff"
        strokeWidth={3.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default NavChevron;
