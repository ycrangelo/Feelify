// faceApiSetup.ts
import * as faceapi from 'face-api.js';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

export const loadFaceApiModels = async () => {
  const MODEL_URL = './assets/models';

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  console.log('✅ face-api.js models loaded');
};
