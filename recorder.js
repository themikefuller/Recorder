'use strict';

function Recorder() {

  let recorder = {};
  let mediaRecorder;
  let permission = false;
  let Started = () => {};
  let recording = false;

  recorder.permission = (video=true,audio=true)=> {
    return new Promise((resolve,reject)=>{
      let promises = [];
      if (video) {
        promises.push(navigator.permissions.query({"name":"camera"}));
      }
      if (audio) {
        promises.push(navigator.permissions.query({"name":"microphone"}));
      }
      Promise.all(promises).then(results=>{
        let ask = false;
        results.forEach(result=>{
          if (result.state != 'granted') {
            ask = true;
          }
        });
        if (ask) {
          navigator.mediaDevices.getUserMedia({"video":video,"audio":audio}).then(stream=>{
            stream.getTracks().forEach(track=> track.stop());
            resolve('permission granted');
          }).catch(err=>{
            reject('permission denied');
          });
        } else {
          resolve('permission granted');
        }
      });
    });
  };

  recorder.getStream = ()=> {
    return new Promise((resolve,reject)=>{
      navigator.mediaDevices.getUserMedia({"video":true,"audio":true}).then(stream=>{
        resolve(stream);
      }).catch(err=>{
        reject({"code":400,"message":"Could not gain access to recording devices."});
      });
    });
  };

  recorder.record = function(stream,options={}) {
    return new Promise((resolve,reject)=>{
        let type = options.type || "video/webm";
        let chunks = [];
        let source = new MediaSource(stream);
        mediaRecorder = new MediaRecorder(stream,{
          audioBitsPerSecond: options.audioBitrate || 128000,
          videoBitsPerSecond: options.videoBitrate|| 2500000
        });
        mediaRecorder.start();
        mediaRecorder.onstart = () =>{
          Started();
          recorder.recording = true;
        };
        mediaRecorder.ondataavailable = function(e) {
          chunks.push(e.data);
        };
        mediaRecorder.onstop = function() {
          stream.getTracks().forEach(track => track.stop());
          recorder.recording = false;
          let blob = new Blob(chunks, {
            "type": type
          });
          let reader = new FileReader();
          reader.onload = (e)=>{
            resolve(e.target.result);
          };
          reader.readAsDataURL(blob);
        };
    });
  };

  recorder.onStart = (callback)=>{
    if (callback && typeof callback === 'function') {
        Started = callback;
    }
  };

  recorder.stop = function() {
    setTimeout(()=>{
      mediaRecorder.stop();
    },500);
  };

  return recorder;

}
