import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import { initTf } from '../../frontend/tfSetup';
import * as faceapi from 'face-api.js';
import { loadFaceApiModels } from '../faceApiSetup';

export default function EmotionCamera() {
  const cameraRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [photoUri, setPhotoUri] = useState('');
  const [emotion, setEmotion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      await initTf();
      await loadFaceApiModels();
    })();
  }, []);

  const takePhotoAndDetect = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({ base64: true });
    setPhotoUri(photo.uri);

    const img = await faceapi.fetchImage(photo.uri);
    const detections = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (detections) {
      const expressions = detections.expressions;
      const maxEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );
      setEmotion(maxEmotion);
    } else {
      setEmotion('No face detected');
    }
  };

  if (!hasPermission) return <Text>No camera permission</Text>;

  return (
    <View style={styles.container}>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
      <Camera ref={cameraRef} style={styles.camera} />

      <TouchableOpacity onPress={takePhotoAndDetect} style={styles.button}>
        <Text style={styles.buttonText}>Capture & Detect Emotion</Text>
      </TouchableOpacity>

      {emotion && <Text style={styles.emotionText}>Emotion: {emotion}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { width: 300, height: 400 },
  button: { marginTop: 20, padding: 15, backgroundColor: '#1DB954', borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  photo: { width: 200, height: 200, marginBottom: 10 },
  emotionText: { fontSize: 20, marginTop: 10, color: '#fff' },
});
