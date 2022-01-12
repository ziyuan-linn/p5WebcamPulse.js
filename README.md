# p5-Webcam-Heart-Rate
## Description
This is a p5.js library for heart rate detection using only the webcam footage. This project uses PPG ([Photoplethysmogram](https://en.wikipedia.org/wiki/Photoplethysmogram))to detect the slight color change of your face or finger and calculates your heart rate. This project is inspired by the [work](https://github.com/serghov/heartRate) of serghov.

This project has two detection modes. In "finger" mode, you place a finger on the webcam; this mode is often more accurate. In "face" mode, the webcam automatically tracks a region of your face for detection. For both detection methods, you have to remain relatively still to get an accurate result.

For now, this project requires [ml5.js](https://ml5js.org/) for face tracking.

## Usage
### p5.js Web Editor
Make a copy of this [p5.js Web Editor project](https://editor.p5js.org/zl4140/sketches/ifz1L5W1M) and get started by editing the sketch.js file.

### Download
1. Download P5WebcamPulse.js and include it in your working directory.

2. Add the following code to the html file.
```
<script src="https://unpkg.com/ml5@latest/dist/ml5.min.js"></script>
<script src="WebcamPulse.js"></script>
```

3. Create a global variable and initialize the detector object with the following code in setup().
```
detector = new P5WebcamPulse();
```
### Methods
1. P5WebcamPulse.setDetectionMode(mode)

Set the detection mode to either face or finger.
```
detector.setDetectionMode("face");
//or
detector.setDetectionMode("finger");
```

2. P5WebcamPulse.displayVideo()

Display one frame of the webcam video with the detection region marked, usually called in draw().
```
detector.displayVideo();
```

3. P5WebcamPulse.getProcessedBrightness()

Get the relative brightness of the detection region based on past samples, return a value between -1 and 1.
```
detector.getProcessedBrightness();
```

4. P5WebcamPulse.getRawBrightness()

Get the relative brightness of the detection region, return a value between 0 and 255.
```
detector.getRawBrightness();
```

5. P5WebcamPulse.getHeartRate()

Get the current heart rate in beats per minute.
```
detector.getHeartRate();
```
