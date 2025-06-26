import React, { useState } from 'react';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';


const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    try{
      const uid = await loginUser(email, password);
      login(uid);
    }
    catch (error: any) {
      console.log("Lỗi đăng nhập:", error);
      Alert.alert('Lỗi đăng nhập', `Vui lòng kiểm tra lại email và mật khẩu của bạn.`);
    }
  };

  const handleGuestLogin = async () => {
    try {
      const uid = await loginUser('guest@gmail.com', '123456'); // hoặc gọi hàm loginGuest()
      login(uid);
    } catch (error) {
      console.error('Lỗi đăng nhập khách:', error);
      Alert.alert('Lỗi', 'Không thể đăng nhập khách.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Đăng nhập tài khoản</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.buttonContainer}>
        <Button title="Đăng nhập" onPress={handleLogin} color="#007bff" />
      </View>
      <TouchableOpacity onPress={handleGuestLogin} style={styles.guestButton}>
        <Text style={styles.guestText}>Trải nghiệm ngay không cần tài khoản</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerLink}>Chưa có tài khoản? Đăng ký</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 32,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  registerLink: {
    marginTop: 20,
    color: '#007bff',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  guestButton: {
    marginTop: 16,
    padding: 10,
  },
  
  guestText: {
    color: '#6c757d',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
