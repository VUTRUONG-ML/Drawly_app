import { View, Text, Button } from 'react-native';


export default function HomeScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home Screen</Text>
      <Button title="Go to Draw" onPress={() => navigation.navigate('Draw')} />
      <Button title="Go to Login" onPress={() => navigation.navigate('Login')} />
      <Button title="Go to Register" onPress={() => navigation.navigate('Register')} />
      <Button title="Go to Gallery" onPress={() => navigation.navigate('Gallery')} />
    </View>
  );
}
