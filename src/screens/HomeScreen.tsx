import { View, Text, Button } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }: any) {
  const { isAuthenticated,logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Đăng xuất" onPress={() => {
        logout(); // gọi hàm đăng xuất
      }} />
      </View>
      <Text>Home Screen</Text>
      <Button title="Go to Draw" onPress={() => navigation.navigate('Draw')} />
      { !isAuthenticated && (
        <>
          <Button title="Go to Login" onPress={() => navigation.navigate('Login')} />
          <Button title="Go to Register" onPress={() => navigation.navigate('Register')} />
        </>
      )}
      <Button title="Go to Gallery" onPress={() => navigation.navigate('Gallery')} />
    </View>
  );
}
