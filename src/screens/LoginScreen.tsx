import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Đăng nhập thành công", `Chào mừng ${email}`);
    } catch (error: any) {
      Alert.alert("Đăng nhập thất bại", error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />
      <TextInput
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />
      <Button title="Đăng nhập" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
