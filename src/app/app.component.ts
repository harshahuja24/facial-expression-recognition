import { Component, OnInit } from '@angular/core';
import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  emotion: string = 'neutral'; // Default emotion
  backgroundColor: string = '#ffffff'; // Default background color (white)
  emotionDetectionActive: boolean = true; // Control emotion detection
  emotionStartTime: number | null = null; // Track when the emotion was first detected

  async ngOnInit() {
    await this.loadModels();
    this.startVideo();
    this.detectExpressions();
  }

  async loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/assets/models');
  }

  startVideo() {
    const video = document.getElementById('video') as HTMLVideoElement;
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
      });
  }

  async detectExpressions() {
    const video = document.getElementById('video') as HTMLVideoElement;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const displaySize = { width: 640, height: 480 };

    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      if (!this.emotionDetectionActive) return; // Stop detection if inactive

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        this.updateEmotion(expressions);
      }
    }, 10); // Check emotions every 100ms
  }

  updateEmotion(expressions: any) {
    const emotions = ['happy', 'neutral', 'sad'];
    let maxEmotion = 'neutral';
    let maxScore = expressions.neutral;

    // Find the emotion with the highest score
    emotions.forEach((emotion) => {
      if (expressions[emotion] > maxScore) {
        maxEmotion = emotion;
        maxScore = expressions[emotion];
      }
    });

    // If the emotion changes, reset the start time
    if (this.emotion !== maxEmotion) {
      this.emotion = maxEmotion;
      this.emotionStartTime = Date.now();
    }

    // If the same emotion is detected for 4 seconds, change the background color
    if (this.emotionStartTime && Date.now() - this.emotionStartTime >= 300) {
      this.changeBackgroundColor(maxEmotion);
      this.emotionStartTime = null; // Reset the timer
    }
  }

  changeBackgroundColor(emotion: string) {
    let newColor: string;

    switch (emotion) {
      case 'happy':
        newColor = 'green'; // Light blue
        break;
      case 'neutral':
        newColor = 'red'; // White
        break;
      case 'sad':
        newColor = 'red'; // Pinkish
        break;
      default:
        newColor = '#ffffff'; // Default to white
    }

    // Smoothly transition the background color
    this.backgroundColor = newColor;
  }
}