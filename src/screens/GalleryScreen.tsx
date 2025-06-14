import React, { use, useEffect, useState } from 'react';

import { View, Text, StyleSheet, FlatList } from 'react-native';
import { getDrawsByUser } from '../services/drawService';

type Draw = {
  drawId: string;
  drawName: string;
};

const GalleryScreen = () => {
  const userId = "user1021";

  const [nameDraws, setNameDraws] = useState<Draw[]>([]);
  useEffect(() => {
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
  }, [])

  return (
    <View style={styles.container}>
      <FlatList
        data={nameDraws}
        keyExtractor={(item) => item.drawId}
        renderItem={({item}) =>{
          return (
            <View style = { styles.item }>
              <Text>{item.drawName}</Text>
            </View>
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
