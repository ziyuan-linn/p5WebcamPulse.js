let detector;
let data = [];

function setup() {
  createCanvas(400, 400);
  background(220);
  stroke(0);
  strokeWeight(1);
  textSize(25);
  //initialize the heart rate detector
  detector = new P5WebcamPulse(); 
  //detection mode can be set to "finger" or "face"
  //for "finger" mode, the user places a finger on the webcam; this mode is often more accurate
  //for "face" mode, the webcam automatically tracks the user's face for detection
  detector.setDetectionMode("face");
  //fill the data array with 200 elements
  for (let i = 0; i < 300; i++) {
    data.push(0);
  }
}

function draw() {
  background(220);
  //display the webcam video
  detector.displayVideo(); 
  //getProcessedBrightness returns a value between -1 and 1, a relative brightness value of the detection region based on past samples
  let currentData = detector.getProcessedBrightness();
  //update the data array by removing the first element and adding a new data point at the end
  data.shift();
  data.push(currentData);
  //draw a plot with the data points
  line(0, 200, 400, 200);
  for (let i = 1; i < data.length; i++) {
    let previousX = i - 1;
    let previousY =200 + data[i - 1] * 50
    let currentX = i;
    let currentY = 200 + data[i] * 50;
    line(previousX, previousY, currentX, currentY);
  }
  //print the heart rate 
  let heartRate = detector.getHeartRate();
  text("Heartrate: " + heartRate + " bpm", 0,300);
} 
