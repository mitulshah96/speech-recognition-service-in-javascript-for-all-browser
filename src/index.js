import React, { Component } from "react";
import ReactDOM from "react-dom";
import Speech from "./Speech";
/* eslint import/no-webpack-loader-syntax: off */
  // import Worker from "worker-loader!./worker";

class App extends Component {
 constructor(){
    super(); 
    function getText(text){
      document.getElementById("voice").value = text;
     }
     new Speech().start(getText);
 }
 
  render() {
    return (
      <div className="App">
      <input type="text" id="voice"/>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
