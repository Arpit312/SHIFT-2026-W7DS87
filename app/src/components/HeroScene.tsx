import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';
import Svg, { Polygon, Ellipse, Defs, RadialGradient, Stop, Line } from 'react-native-svg';

export default function HeroScene() {
  const floatY = useSharedValue(0);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    // Floating animation (whole scene moves up and down)
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(12, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Independent ring rotation (slower spin)
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatY.value }],
    };
  });

  const ringStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${ringRotation.value}deg` }],
    };
  });

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.container]} pointerEvents="none">
      <View style={[styles.glow, { backgroundColor: 'rgba(255, 122, 26, 0.1)', top: '15%', left: '15%' }]} />
      <View style={[styles.glow, { backgroundColor: 'rgba(217, 169, 60, 0.1)', bottom: '15%', right: '15%' }]} />

      <Animated.View style={[styles.centerNode, floatingStyle]}>
        
        {/* STABLE STONE CORE (Does not rotate) */}
        <Svg width="350" height="350" viewBox="0 0 300 300" style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FF7A1A" stopOpacity="1" />
              <Stop offset="40%" stopColor="#FF7A1A" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#FF7A1A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          
          {/* Icosahedron Wireframe */}
          <Polygon points="150,50 236.6,100 236.6,200 150,250 63.4,200 63.4,100" fill="none" stroke="#D9A93C" strokeWidth="1" opacity="0.3" />
          <Polygon points="150,105 193.3,180 106.7,180" fill="none" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Polygon points="150,195 106.7,120 193.3,120" fill="none" stroke="#D9A93C" strokeWidth="1" opacity="0.15" />
          
          <Line x1="150" y1="50" x2="150" y2="105" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Line x1="236.6" y1="100" x2="150" y2="105" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Line x1="63.4" y1="100" x2="150" y2="105" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Line x1="236.6" y1="200" x2="193.3" y2="180" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Line x1="150" y1="250" x2="193.3" y2="180" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Line x1="150" y1="250" x2="106.7" y2="180" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Line x1="63.4" y1="200" x2="106.7" y2="180" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Line x1="236.6" y1="100" x2="193.3" y2="180" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />
          <Line x1="63.4" y1="100" x2="106.7" y2="180" stroke="#D9A93C" strokeWidth="1" opacity="0.5" />

          {/* Solid Glowing Core (Hexagon) */}
          <Polygon points="150,105 189,127.5 189,172.5 150,195 111,172.5 111,127.5" fill="url(#coreGlow)" opacity="0.9" />
          <Polygon points="150,105 189,127.5 189,172.5 150,195 111,172.5 111,127.5" fill="none" stroke="#FF7A1A" strokeWidth="2" opacity="0.9" />
        </Svg>

        {/* SPINNING RINGS (Independently rotating) */}
        <Animated.View style={[StyleSheet.absoluteFillObject, ringStyle]}>
          <Svg width="350" height="350" viewBox="0 0 300 300">
            {/* Orbiting Gold Rings (Thin and intersecting) */}
            <Ellipse cx="150" cy="150" rx="140" ry="25" stroke="#D9A93C" strokeWidth="2" fill="none" opacity="0.7" transform="rotate(-30 150 150)" />
            <Ellipse cx="150" cy="150" rx="140" ry="15" stroke="#D9A93C" strokeWidth="1.5" fill="none" opacity="0.4" transform="rotate(60 150 150)" />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNode: {
    width: 350,
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  }
});
