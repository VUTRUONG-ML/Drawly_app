import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import DrawScreen from '../screens/DrawScreen';
import GalleryScreen from '../screens/GalleryScreen';
import { AuthProvider, useAuth } from '../context/AuthContext'; // tạo ở bước 1
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import DrawingCanvas from '../components/DrawingCanvas';
import FontAwesome from '@expo/vector-icons/FontAwesome';
// import CreateDrawScreen from '../screens/CreateDrawScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, loading, logout } = useAuth();
  const confirmLogout = () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng xuất", style: "destructive", onPress: logout }
      ]
    );
  };
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator  initialRouteName={isAuthenticated ? 'Gallery' : 'Home'}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
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
          <Stack.Screen 
            name="Gallery" 
            component={GalleryScreen} 
            options={{
              headerRight:() => {
                return (
                  <TouchableOpacity
                    onPress={confirmLogout}
                    style = {{marginRight: 15}}
                  >
                    <FontAwesome name="sign-out" size={24} color="black" />
                  </TouchableOpacity>
                );
              },
              title: "Gallery"
            }}/>
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
