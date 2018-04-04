How it works
SpeechRecognition is a class that wraps one of your React components. In doing so, it injects some additional properties into the component that allow it to access a transcript of speech picked up from the user's microphone.

Under the hood, it uses Web Speech API. Currently, this component will  work in Chrome,firefox,safari,edge 

You will need a dependency manager like Browserify or Webpack to bundle this module with your web code.

For firefox and other browser it takes audio and convert into flac format and flac file is been passed to Gapi which converts to speech for rest of the browser

You need to add scipt to your index.html to access gapi
 <script src="https://apis.google.com/js/api.js"></script>
  <script type="text/javascript" src="./gapi.js"></script>
