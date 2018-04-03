importScripts("/lib/libflac3-1.3.2.js");
var flac_encoder,
    BUFSIZE = 4096,
    CHANNELS = 1,
    SAMPLERATE = 44100,
    COMPRESSION = 5,
    BPS = 16,
    flac_ok = 1;
	flacBuffers = [],
	flacLength = 0,
	INIT = false,
	

self.onmessage = function(e) {
	switch (e.data.cmd) {
	case 'init':
		initFlac();
		break;
		
	case 'encode':
		encodeFlac(e.data.buf);
		break;
		
	case 'finish':
		flac_ok &= Flac.FLAC__stream_encoder_finish(flac_encoder);
		console.log("flac finish: " + flac_ok);//DEBUG
		var data = exportFlacFile(flacBuffers, flacLength, mergeBuffersUint8);
		Flac.FLAC__stream_encoder_delete(flac_encoder);
		clear();
		self.postMessage({cmd: 'end', buf: data});
		INIT = false;
		break;
	}
};

//HELPER: handle initialization of flac encoder
function initFlac(){
	flac_encoder = Flac.create_libflac_encoder(SAMPLERATE, CHANNELS, BPS, COMPRESSION, 0);
	if (flac_encoder == 0){
		return;
	}
	var status_encoder = Flac.init_encoder_stream(flac_encoder, function(encodedData /*Uint8Array*/, bytes, samples, current_frame){
		//store all encoded data "pieces" into a buffer 
		flacBuffers.push(encodedData);
		flacLength += encodedData.byteLength;
	});
	flac_ok &= (status_encoder == 0);
	console.log("flac init     : " + flac_ok);//DEBUG
	console.log("status encoder: " + status_encoder);//DEBUG
	INIT = true;
	
}

//HELPER: handle incoming PCM audio data for Flac encoding:
function encodeFlac(buffer){
	var buf_length = buffer.length;
	var buffer_i32 = new Uint32Array(buf_length);
	var view = new DataView(buffer_i32.buffer);
	var volume = 1;
	var index = 0;
	for (var i = 0; i < buf_length; i++){
		view.setInt32(index, (buffer[i] * (0x7FFF * volume)), true);
		index += 4;
	}
	var flac_return = Flac.FLAC__stream_encoder_process_interleaved(flac_encoder, buffer_i32, buf_length);
	if (flac_return != true){
		console.log("Error: FLAC__stream_encoder_process_interleaved returned false. " + flac_return);
	}
}


function exportFlacFile(recBuffers, recLength){
	var samples = mergeBuffersUint8(recBuffers, recLength);
	var the_blob = new Blob([samples], { type: 'audio/flac' });
	return the_blob;
}


function mergeBuffersUint8(channelBuffer, recordingLength){
	var result = new Uint8Array(recordingLength);
	var offset = 0;
	var lng = channelBuffer.length;
	for (var i = 0; i < lng; i++){
		var buffer = channelBuffer[i];
		result.set(buffer, offset);
		offset += buffer.length;
	}
	return result;
}


/*
 * clear recording buffers
 */
function clear(){
	flacBuffers.splice(0, flacBuffers.length);
	flacLength = 0;
}