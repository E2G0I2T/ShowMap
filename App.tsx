import React from 'react';
import { View, Platform, Dimensions } from 'react-native'; // 💡 Dimensions 추가
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ListScreen from './src/screens/ListScreen';
import DetailScreen from './src/screens/DetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    /* 💡 vh 단위 대신 Dimensions.get("window").height를 사용하여 TS 에러를 방지합니다. */
    <View style={{ 
      flex: 1, 
      height: Platform.OS === 'web' ? Dimensions.get("window").height : '100%',
      backgroundColor: '#fff' 
    }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="List">
          <Stack.Screen 
            name="List" 
            component={ListScreen} 
            options={{ title: '공연 목록 탐색' }} 
          />
          <Stack.Screen 
            name="Detail" 
            component={DetailScreen} 
            options={{ title: '공연 상세 정보' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}