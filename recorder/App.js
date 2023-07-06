import React, { useState, useEffect } from 'react';
import { Button, TextInput, View, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [sound, setSound] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    setFilteredRecordings(
      recordings.filter((recording) => recording.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, recordings]);

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      }); 
      console.log('Starting recording..');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    setRecordings([
      ...recordings,
      {
        uri,
        name,
        description,
      },
    ]);
    console.log('Recording stopped and stored at', uri);
  };

  const playSound = async (uri) => {
    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );
    setSound(sound);
    console.log('Playing Sound');

    await Audio.setAudioModeAsync({
      allowsPlaybackInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: true,
      staysActiveInBackground: true,
    });

    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync(); }
      : undefined;
  }, [sound]);

  const selectRecording = (recording) => {
    setSelectedRecording(recording);
    setEditName(recording.name);
    setEditDescription(recording.description);
  };

  const saveEdits = () => {
    setRecordings(recordings.map((rec) => 
      rec.uri === selectedRecording.uri
        ? { ...rec, name: editName, description: editDescription }
        : rec
    ));
    setSelectedRecording(null);
    setEditName('');
    setEditDescription('');
  };

  return (
    <View style={styles.container}>
      <TextInput
              placeholder="Recording Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="Recording Description"
              value={description}
              onChangeText={setDescription}
            />
            <Button title={isRecording ? 'Stop Recording' : 'Start Recording'} onPress={isRecording ? stopRecording : startRecording} />
            <TextInput
              placeholder="Search"
              value={search}
              onChangeText={setSearch}
            />
            {selectedRecording ? (
              <View>
                <TextInput
                  placeholder="New Name"
                  value={editName}
                  onChangeText={setEditName}
                />
                <TextInput
                  placeholder="New Description"
                  value={editDescription}
                  onChangeText={setEditDescription}
                />
                <Button title="Save Edits" onPress={saveEdits} />
              </View>
            ) : (
              filteredRecordings.map((recording, i) => (
                <View key={i}>
                  <Text>Name: {recording.name}</Text>
                  <Text>Description: {recording.description}</Text>
                  <Text>URI: {recording.uri}</Text>
                  <Button title="Play Recording" onPress={() => playSound(recording.uri)} />
                  <Button title="Edit Recording" onPress={() => selectRecording(recording)} />
                </View>
              ))
            )}
          </View>
        );
      };
      
      const styles = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
      
      export default App;
      

