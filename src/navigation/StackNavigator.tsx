import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import DrawScreen from '../screens/DrawScreen';
import GalleryScreen from '../screens/GalleryScreen';
import { AuthProvider, useAuth } from '../context/AuthContext'; // tạo ở bước 1
import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DrawingCanvas from '../components/drawingCanvas';
import FontAwesome from '@expo/vector-icons/FontAwesome';
// import CreateDrawScreen from '../screens/CreateDrawScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator  initialRouteName={isAuthenticated ? 'Home' : 'Login'}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Draw"
          component={DrawScreen}
          options={({ navigation }) => ({
            headerRight: () => (
              <TouchableOpacity
                onPress={() => {
                  navigation.setParams({ saveRequested: true });
                }}
                style={{ marginRight: 15 }}
              >
                <FontAwesome name="save" size={24} color="black" />
              </TouchableOpacity>
            ),
          })}
        />
          <Stack.Screen name="Gallery" component={GalleryScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function StackNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer >
        <AppNavigator  />
      </NavigationContainer>
    </AuthProvider>
  );
}
