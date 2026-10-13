import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type TapButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Darken the control while it is held. Turn off for full-screen dismiss targets. */
  feedback?: boolean;
};

function shadeStyle(style?: StyleProp<ViewStyle>): ViewStyle {
  const flat = StyleSheet.flatten(style) || {};
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    zIndex: 2,
    borderRadius: flat.borderRadius,
    borderTopLeftRadius: flat.borderTopLeftRadius,
    borderTopRightRadius: flat.borderTopRightRadius,
    borderBottomLeftRadius: flat.borderBottomLeftRadius,
    borderBottomRightRadius: flat.borderBottomRightRadius,
  };
}

const TapButton = ({ style, children, feedback = true, disabled, ...rest }: TapButtonProps) => (
  <Pressable {...rest} disabled={disabled} style={style}>
    {({ pressed }) => (
      <>
        {children}
        {feedback && pressed && !disabled ? <View pointerEvents="none" style={shadeStyle(style)} /> : null}
      </>
    )}
  </Pressable>
);

export default TapButton;
