import React, { useState } from 'react';
import { View, Button, Text, TextInput, ScrollView, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { storage, storageRef } from './firebase';
import { getDownloadURL, uploadBytes } from 'firebase/storage';

const App = () => {
  const [serverStatus, setServerStatus] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState();

  const checkServerConnectivity = () => {
    setLoading(true);
    fetch('http://192.168.111.150:5000/test_connection')
      .then((response) => {
        if (response.ok) {
          setServerStatus('Server is reachable');
        } else {
          setServerStatus('Server is not reachable');
        }
      })
      .catch(() => {
        setServerStatus('Server is not reachable');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const generateImageCaption = () => {
    setLoading(true);
    fetch('http://192.168.111.150:5000/generate_caption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    })
      .then((response) => response.json())
      .then((data) => {
        setCaption(data.caption);
      })
      .catch(() => {
        setCaption('Error occurred while generating caption');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const selectImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      multiple: true, // Allow selecting multiple images
    });
    if (!result.canceled) {
      setSelectedImages(result.assets[0].uri);
    }
    console.log(selectedImages);
    const uploadedImages = await uploadImageToStorage(selectedImages)
    setImageUrl(uploadedImages);
  };

  const uploadImageToStorage = async (imageUri) => {
    try {
      const timestamp = Date.now(); // Get current timestamp
      const imageName = `image_${timestamp}`;
  
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageRef = storageRef(storage, `bazaar/${imageName}`);
  
      const snapshot = await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL; // Return the download URL of the uploaded image
    } catch (error) {
      console.error("Error uploading image:", error);
      return null; // Return null in case of error
    }
  };
  

  return (
    <ScrollView style={{ padding: 20 }}>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Server Connectivity Check</Text>
        <Button title="Check Server Connectivity" onPress={checkServerConnectivity} disabled={loading} />
        {serverStatus !== '' && <Text style={{ marginTop: 10, color: serverStatus === 'Server is reachable' ? 'green' : 'red' }}>{serverStatus}</Text>}
      </View>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Pick an Image</Text>
        <Button title="Pick an Image" onPress={() => selectImages()} disabled={loading} />
      </View>
      {selectedImages !== null && (
        <View style={{ marginTop: 10, alignItems: 'center', marginLeft: 20, marginRight: 20 }}>
            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                <Image source={{ uri: selectedImages }} style={{ width: 200, height:600, marginRight: 10 }} resizeMode='contain' />
            </View>
        </View>
      )}
      <View style={{marginBottom:100}}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Generate Image Caption</Text>
        <Button title="Generate Caption" onPress={generateImageCaption} disabled={loading || imageUrl === ''} />
        {loading && <Text style={{ marginTop: 10, color: 'blue' }}>Loading...</Text>}
        {caption !== '' && <Text style={{ marginTop: 10, fontStyle: 'italic' }}>{caption}</Text>}
      </View>
    </ScrollView>
  );
};

export default App;
