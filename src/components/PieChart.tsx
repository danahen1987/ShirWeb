import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const PieChart = ({ percentage, size = 60, strokeWidth = 6 }: { percentage: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const angle = (percentage / 100) * 360;
  const angleRad = (angle * Math.PI) / 180;
  const endX = centerX + radius * Math.sin(angleRad);
  const endY = centerY - radius * Math.cos(angleRad);

  const createPieSlice = () => {
    if (percentage === 0) {
      return '';
    }

    if (percentage === 100) {
      return `M ${centerX} ${centerY} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0 Z`;
    }

    const largeArcFlag = angle > 180 ? 1 : 0;
    return `M ${centerX} ${centerY} L ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Path d={createPieSlice()} fill="#3498db" stroke="none" />
      </Svg>
      <Text
        style={{
          fontSize: 12,
          fontWeight: 'bold',
          color: '#2c3e50',
          textAlign: 'center',
        }}
      >
        {percentage}%
      </Text>
    </View>
  );
};

export default PieChart;
