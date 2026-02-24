import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 1. 새롭게 만든 스크린들을 가져옵니다.
import ListScreen from './src/screens/ListScreen';
import DetailScreen from './src/screens/DetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* 2. initialRouteName을 'List'로 설정하여 리스트가 먼저 뜨게 합니다. */}
      <Stack.Navigator initialRouteName="List">
        
        {/* 공연 목록 화면 */}
        <Stack.Screen 
          name="List" 
          component={ListScreen} 
          options={{ title: '공연 목록 탐색' }} 
        />
        
        {/* 공연 상세 및 지도 화면 */}
        <Stack.Screen 
          name="Detail" 
          component={DetailScreen} 
          options={{ title: '공연 상세 정보' }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}