import React, { use, useEffect, useState } from 'react';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { getDrawsByUser } from '../services/drawService';
import { useAuth } from '../context/AuthContext';

type Draw = {
  drawId: string;
  drawName: string;
};

const GalleryScreen = () => {
  const { userId, loading } = useAuth(); 

  const [nameDraws, setNameDraws] = useState<Draw[]>([]);
  useEffect(() => {
    if (loading || !userId) return;
    const fetchDraws = async () =>{
      try {
        const draws = await getDrawsByUser(userId);
        setNameDraws(draws);
      }
      catch (error) {
        console.error("Error fetching draws:", error);
      }
    }
    fetchDraws();
  }, [loading, userId])

  return (
    <View style={styles.container}>
      
      <FlatList
        data={nameDraws}
        keyExtractor={(item) => item.drawId}
        renderItem={({item}) =>{
          return (
            <Pressable 
              style = {({pressed}) => ({opacity: pressed ? 0.5 : 1})}
              >
              <View style = { styles.item }>
                <Text>{item.drawName}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

export default GalleryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  item:{
    padding: 20,
    marginVertical: 8,  
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});
