// tfSetup.ts
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

export const initTf = async () => {
  await tf.ready(); // wait for TFJS runtime
  console.log('✅ TensorFlow ready');
};
