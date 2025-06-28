import { View, Text, Button, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function HomeScreen({ navigation }: any) {
  const { isAuthenticated,logout } = useAuth();
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../../assets/logoDraw.png')} // đặt đúng đường dẫn
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialCommunityIcons name="cookie-edit" size={24} color="red" />

        <Text style={styles.title}>Drawly App</Text>
      </View>
      
      <Text style={styles.subtitle}>Chào mừng bạn đến với không gian sáng tạo!</Text>

      { !isAuthenticated && (
        <>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </>
      )}

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBE6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFB300',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    elevation: 2,
  },
  loginButton: {
    backgroundColor: '#FFD54F',
  },
  registerButton: {
    backgroundColor: '#F9A825',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
