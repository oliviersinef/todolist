import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolate,
  useAnimatedReaction,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 80,
  strokeWidth = 8,
  color = '#ff9800',
  backgroundColor = '#f6f3f2',
  children
}) => {
  const progress = useSharedValue(0);
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(Math.max(percentage, 0), 100) / 100, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  }, [percentage]);

  // Synchronize state with animation for perfectly proportional text update
  useAnimatedReaction(
    () => progress.value,
    (currentValue) => {
      runOnJS(setDisplayPercentage)(Math.round(currentValue * 100));
    }
  );

  // Right side covers 0% to 50%
  const rightHalfStyle = useAnimatedStyle(() => {
    // Rotates from -180 (hidden) to 0 (visible)
    const rotate = interpolate(progress.value, [0, 0.5], [-180, 0], 'clamp');
    return {
      transform: [
        { translateX: -size / 4 },
        { rotate: `${rotate}deg` },
        { translateX: size / 4 }
      ],
    };
  });

  // Left side covers 50% to 100%
  const leftHalfStyle = useAnimatedStyle(() => {
    // Rotates from -180 (hidden) to 0 (visible)
    const rotate = interpolate(progress.value, [0.5, 1], [-180, 0], 'clamp');
    return {
      transform: [
        { translateX: size / 4 },
        { rotate: `${rotate}deg` },
        { translateX: -size / 4 }
      ],
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View style={[styles.circle, { 
        width: size, 
        height: size, 
        borderRadius: size / 2, 
        backgroundColor: backgroundColor 
      }]} />
      
      {/* Right side container */}
      <View style={[styles.halfCircleContainer, { width: size / 2, height: size, right: 0 }]}>
        <Animated.View style={[styles.halfCircle, { 
          width: size / 2, 
          height: size, 
          borderRadius: size,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          backgroundColor: color,
          left: 0,
        }, rightHalfStyle]} />
      </View>
      
      {/* Left side container */}
      <View style={[styles.halfCircleContainer, { width: size / 2, height: size, left: 0 }]}>
        <Animated.View style={[styles.halfCircle, { 
          width: size / 2, 
          height: size, 
          borderRadius: size,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: color,
          right: 0,
        }, leftHalfStyle]} />
      </View>

      {/* Inner Mask (Hollow Center) */}
      <View style={[styles.innerCircle, { 
        width: size - strokeWidth * 2, 
        height: size - strokeWidth * 2, 
        borderRadius: (size - strokeWidth * 2) / 2,
        backgroundColor: '#ffffff',
        zIndex: 10,
      }]}>
        <View style={styles.contentContainer}>
          <Text style={styles.percentageText}>{displayPercentage}%</Text>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
  },
  halfCircleContainer: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
  },
  innerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1b1c1c',
    textAlign: 'center',
  }
});

export default CircularProgress;
