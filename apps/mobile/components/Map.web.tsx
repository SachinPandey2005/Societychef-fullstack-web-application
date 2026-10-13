import React from 'react';
import { View, Text } from 'react-native';

export type Region = any;

export default function MapView(props: any) {
  return (
    <View style={[{ backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }, props.style]}>
      <Text>Map Preview Not Supported on Web</Text>
      {props.children}
    </View>
  );
}

export function Marker(props: any) {
  return null;
}

export function Polyline(props: any) {
  return null;
}
