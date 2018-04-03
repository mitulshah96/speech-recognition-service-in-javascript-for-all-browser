/* eslint import/no-webpack-loader-syntax: off */
import Worker from "worker-loader!./worker";

if (!!window.chrome && !!window.chrome.webstore) {
  var recognition = new (window.webkitSpeechRecognition ||
    window.SpeechRecognition)();
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function(stream) {
      console.log("You let me use your mic!");
    })
    .catch(function(err) {
      console.log("No Mic Permission!");
    });
} else {
  var context = new (window.AudioContext ||
    window.webkitAudioContext ||
    handleContext)();
  var encoder;
}

function handleContext() {
  window.voiceSupport = false;
}

export default class Speech {
  recording = false;
  stream = null;
  input = null;
  node = null;

  start(getText) {
    this.recording = true;
    if (!!recognition) {
      //Chrome Support
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognition.start();

      recognition.addEventListener("result", e => {
        const text = e.results[0][0].transcript;
        recognition.stop();
        getText(text);
        this.recording = false;
      });
    } else if (!!context) {
      //Other browser
      try {
        encoder = new Worker();

        encoder.onmessage = e => {
          if (e.data.cmd === "end") {
            const speechSender = new FileReader();
            speechSender.addEventListener("loadend", () => {
              window.gapi.client.speech.speech
                .syncrecognize({
                  config: {
                    encoding: "flac",
                    sampleRate: 44100
                  },
                  audio: {
                    content: btoa(speechSender.result)
                  }
                })
                .execute(r => {
                  if (r.results && r.results[0]) {
                    const text = r.results[0].alternatives[0].transcript;
                    getText(text);
                  } else {
                    const text = "";
                    getText(text);
                  }
                });
            });

            speechSender.readAsBinaryString(e.data.buf);
            encoder.terminate();
            encoder = null;
          } else if (e.data.cmd === "debug") {
            console.log(`debugging: ${e.data}`);
          } else {
            console.error(`Unknown event: ${e.data.cmd}`);
          }
        };

        window.navigator.getUserMedia =
          window.navigator.getUserMedia ||
          window.navigator.webkitGetUserMedia ||
          window.navigator.mozGetUserMedia;

        if (window.navigator.getUserMedia) {
          window.navigator.getUserMedia(
            {
              video: false,
              audio: true
            },
            this._gotUserMedia.bind(this),
            this._userMediaFailed.bind(this)
          );
        } else {
          handleContext();
        }
      } catch (err) {
        // when speech error occurs
        console.log("speech service -->", err);
      }
    } else {
      console.log("Not supportted");
    }
  }

  // success event voice permission
  _gotUserMedia(localMediaStream) {
    this.stream = localMediaStream;
    this.input = context.createMediaStreamSource(this.stream);

    if (this.input.context.createJavaScriptNode) {
      this.node = this.input.context.createJavaScriptNode(4096, 1, 1);
    } else if (this.input.context.createScriptProcessor) {
      this.node = this.input.context.createScriptProcessor(4096, 1, 1);
    } else {
      console.error(
        "Could not create audio node for JavaScript based Audio Processing."
      );
    }
    encoder.postMessage({
      cmd: "init",
      config: {
        samplerate: 44100,
        bps: 16,
        channels: 1,
        compression: 5
      }
    });

    this.node.onaudioprocess = e => {
      const channelLeft = e.inputBuffer.getChannelData(0);

      encoder.postMessage({
        cmd: "encode",
        buf: channelLeft
      });
    };

    this.input.connect(this.node);
    this.node.connect(context.destination);

    // // microphone will only work(max) upto this timeout;
    setTimeout(() => {
      this.stop(); // need to stop to get output
    }, 3000);
  }

  _userMediaFailed(code) {
    console.log(`grabbing microphone failed: ${code}`);
  }

  stop() {
    if (!this.recording) {
      return;
    }
    if (!!recognition) {
      recognition.abort();
    } else {
      const tracks = this.stream.getAudioTracks();

      for (let i = tracks.length - 1; i >= 0; --i) {
        tracks[i].stop();
      }

      this.recording = false;
      encoder.postMessage({
        cmd: "finish"
      });

      this.input.disconnect();
      this.node.disconnect();
      this.input = this.node = null;
    }
  }
}
