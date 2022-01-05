class P5WebcamPulse {
  constructor() {
    this.faceMode = true;
    this.facePositions = [];
    //short array that stores the past 20 data points
    this.history = [];
    for (let i = 0; i < 10; i++) {
      this.history.push(127);
    }
    //stores the past 200 normalized data points
    this.normalizedHistory = [];
    for (let i = 0; i < 256; i++) {
      this.normalizedHistory.push(0);
    }
    //time of last data update
    this.prevTime = 0;
    //history of time per data calculation
    this.times = [];
    for (let i = 0; i < 256; i++) {
      this.times[i] = 33;
    }
    //average time per data calculation
    this.timePerData = 33;
    //video element
    this.video = createCapture(VIDEO); //enable webcam
    this.video.hide();
    //facemash for face tracking
    this.facemesh = ml5.facemesh(this.video);
    this.facemesh.on("predict", (results) => {
      if (results.length > 0) {
        this.facePositions = results[0].scaledMesh;
      }
      this.getRect();
      this.updateHistory();
    });
    //store the past 3 face rectangle predictions
    this.rectXHis = [];
    this.rectYHis = [];
    this.rectWidthHis = [];
    for (let i = 0; i < 3; i++) {
      this.rectXHis.push(-1);
      this.rectYHis.push(0);
      this.rectWidthHis.push(30);
    }
    // face rectangle position
    this.rectX = -1;
    this.rectY = 0;
    this.rectWidth = 30;
  }

  //display webcam video with a marked rectangle region
  displayVideo() {
    image(this.video, 0, 0, this.video.width / 4, this.video.height / 4);
    if (this.rectX != -1) {
      this.displayRect();
    }
  }
  //return the average brightness of the face region
  getRawBrightness() {
    return this.getRectBrightness();
  }
  //return the processed and normalized brightness of the face region
  getProcessedBrightness() {
    return this.processData(this.getRectBrightness(), this.history);
  }
  //return heartrate in beat per minute
  getHeartRate() {
    return this.calculateHeartRate(this.normalizedHistory,this.timePerData);
  }
  //set detection mode to face or finger
  setDetectionMode(mode) {
    if (mode == "face") {
      this.faceMode = true;
    } else if (mode == "finger") {
      this.faceMode = false;
    }
  }

  //private methods
  //update the history arrays
  updateHistory() {
    let data = this.getRectBrightness();
    this.history.shift();
    this.history.push(data);
    this.normalizedHistory.shift();
    this.normalizedHistory.push(this.processData(data, this.history));
    this.times.shift();
    this.times.push(millis() - this.prevTime);
    this.prevTime = millis();
    this.timePerData = this.arrAverage(this.times);
  }
  //get the rectangle position and width
  getRect() {
    if (this.faceMode) {
      if (this.facePositions.length > 0) {
        this.rectWidthHis.shift();
        this.rectWidthHis.push(
          dist(
            this.facePositions[107][0],
            this.facePositions[107][1],
            this.facePositions[336][0],
            this.facePositions[336][1]
          )
        );
        this.rectXHis.shift();
        this.rectXHis.push(this.facePositions[107][0]);
        this.rectYHis.shift();
        this.rectYHis.push(
          this.facePositions[107][1] -
            this.rectWidthHis[this.rectWidthHis.length - 1]
        );
      }
      this.rectX = this.arrAverage(this.rectXHis);
      this.rectY = this.arrAverage(this.rectYHis);
      this.rectWidth = this.arrAverage(this.rectWidthHis);
    } else {
      this.rectWidth = this.video.height * 0.75;
      this.rectX = (this.video.width - this.rectWidth) / 2;
      this.rectY = (this.video.height - this.rectWidth) / 2;
    }
  }
  //draw the rectangle on the video
  displayRect() {
    push();
    stroke(0, 255, 0);
    strokeWeight(1);
    noFill();
    rect(
      this.rectX / 4,
      this.rectY / 4,
      this.rectWidth / 4,
      this.rectWidth / 4
    );
    pop();
  }
  //get the average green brightness in the rectangle region
  getRectBrightness() {
    if (this.rectX != -1) {
      let region = this.video.get(
        this.rectX,
        this.rectY,
        this.rectWidth,
        this.rectWidth
      );
      region.resize(30, 30);
      region.loadPixels();

      let sum = 0;
      let n = 0;
      for (let i = 0; i < region.pixels.length; i += 4) {
        //sum += region.pixels[i];
        sum += region.pixels[i + 1];
        //sum += region.pixels[i + 2];
        n++;
      }
      return sum / n;
    } else {
      return 127;
    }
  }
  //normalize a data point using mean value
  processData(data, history) {
    let mean = this.arrAverage(history);
    let localMin = mean - 1.7;
    let localMax = mean + 1.7;

    let smoothedData = data;
    for (let i = 0; i < 4; i++) {
      smoothedData += history[history.length - i - 2];
    }
    smoothedData /= 5;

    let processedData = map(smoothedData, localMin, localMax, -1, 1);
    processedData = max(min(processedData, 1), -1);
    return processedData;
  }
  //get the average of an array
  arrAverage(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum / arr.length;
  }
  //compute the heart rate with sequence and total time elapsed
  calculateHeartRate(sequence, msPerData) {
    let data = [...sequence];
    for(let i = 0; i < 1792; i++) {
      data.push(0);
    }
    data = fftMagnitude(data);
    
    let minutePerData = msPerData / 60000;
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < data.length / 2; i++) {
      if (i / data.length / minutePerData  > 50 && i / data.length / minutePerData  < 150 && data[i] > maxValue) {
        maxIndex = i;
        maxValue = data[i];
      }
    }
    let totalWeight = 0;
    let weightedSum = 0;
    for (let i = maxIndex - 1; i <= maxIndex + 1; i++) {
      totalWeight += i * maxIndex;
      weightedSum += i / data.length / minutePerData * i * maxIndex;
    }
    return round(weightedSum / totalWeight, 1);
  }
}

function fftMagnitude(arr) {
  let complex = fft(arr);
  let magnitude = [];
  for (let i = 0; i < complex.length; i++) {
    magnitude[i] = sqrt(complex[i][0] * complex[i][0] + complex[i][1] * complex[i][1]);
  }
  return magnitude;
}

/*===========================================================================*\
 * Fast Fourier Transform (Cooley-Tukey Method)
 *
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Fast Fourier Transform.
\*===========================================================================*/

function fft(vector) {
  var X = [],
    N = vector.length;

  // Base case is X = x + 0i since our input is assumed to be real only.
  if (N == 1) {
    if (Array.isArray(vector[0]))
      //If input vector contains complex numbers
      return [[vector[0][0], vector[0][1]]];
    else return [[vector[0], 0]];
  }

  // Recurse: all even samples
  var X_evens = fft(vector.filter(even)),
    // Recurse: all odd samples
    X_odds = fft(vector.filter(odd));

  // Now, perform N/2 operations!
  for (var k = 0; k < N / 2; k++) {
    // t is a complex number!
    var t = X_evens[k],
      e = complexMultiply(exponent(k, N), X_odds[k]);

    X[k] = complexAdd(t, e);
    X[k + N / 2] = complexSubtract(t, e);
  }

  function even(__, ix) {
    return ix % 2 == 0;
  }

  function odd(__, ix) {
    return ix % 2 == 1;
  }

  return X;
}

function exponent (k, N) {
  let mapExponent = {};
  let x = -2 * Math.PI * (k / N);

  mapExponent[N] = mapExponent[N] || {};
  mapExponent[N][k] = mapExponent[N][k] || [Math.cos(x), Math.sin(x)]; // [Real, Imaginary]

  return mapExponent[N][k];
}

function complexAdd (a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

function complexSubtract (a, b) {
  return [a[0] - b[0], a[1] - b[1]];
}

function complexMultiply (a, b) {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}

/*===========================================================================*\
 * FaceMeshFaceGeometry
 *https://github.com/spite/FaceMeshFaceGeometry
 *
 * Copyright (c) 2020 Jaume Sanchez
\*===========================================================================*/

