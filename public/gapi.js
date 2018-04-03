function start() {
  window.gapi.client.init({
    'apiKey': 'AIzaSyDQ9yIxbDqJOYsm-VgoNThHARkPx3uZKLQ'
  }).then(function () {
    window.gapi.client.load('speech', 'v1beta1');
  }, function (reason) {
    console.log('Error: ' + reason.result.error.message);
  });
};
window.gapi.load('client', start);