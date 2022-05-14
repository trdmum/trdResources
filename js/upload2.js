
// Set the configuration for your app
// TODO: Replace with your app's config object
const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024;
// var ACCESS_TOKEN=sessionStorage.getItem('access_token');
var ACCESS_TOKEN=""


var firebaseConfig = {
  apiKey: "AIzaSyDnStfRyi45PQg_0fWbXSBDA0Kd0V6BS-k",
  authDomain: "pdf-db-8e1a7.firebaseapp.com",
  databaseURL: "https://pdf-db-8e1a7-default-rtdb.firebaseio.com",
  projectId: "pdf-db-8e1a7",
  storageBucket: "pdf-db-8e1a7.appspot.com",
  messagingSenderId: "6672489999",
  appId: "1:6672489999:web:d0551eba5f742319584d7a",
  measurementId: "G-JZ5Z7HNS5F"
};

firebase.initializeApp(firebaseConfig);

// Get a reference to the storage service, which is used to create references in your storage bucket
// var storage = firebase.storage();
// var storageRef = storage.ref();

var database = firebase.database();
var databaseRef = database.ref().child("uploadedPDFdropBox");
var databaseRefDel = database.ref().child("dropboxDelete");

var ref=firebase.database().ref().child('AdminAccessToken');
    ref.once("value").then(function(snapshot) {                  
                putAccessToken(snapshot.val());
            });

// console.log("accessToken="+ACCESS_TOKEN);    
var dbx="";
var metadata = {
  contentType: 'application/pdf'
};
var uploadedCounter=0;

const inputElement = document.getElementById("selected-files");
inputElement.addEventListener("change", handleFiles, false);
var fileList="";

function putAccessToken(token){
  ACCESS_TOKEN=token;
  // console.log("accessToken="+ACCESS_TOKEN);    
  dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
  mainListing();
}

function filesAreSelected(){
  document.getElementById('noFileSelected').innerHTML="";  
}

function dateSelected(){
  document.getElementById('noFileSelected').innerHTML="";  
}

function handleFiles() {
  fileList = this.files;
}

function submitFiles() {
  // console.log('submit clicked');
  var selectedDate=document.getElementById('datePick').value;    
  var fileDate=selectedDate.substring(8)+"."+selectedDate.substring(5,7)+"."+selectedDate.substring(0,4);
  if(fileList.length>0){

    if(fileDate.length>3){
      disableElements();
      let timeNow1 = new Date().toLocaleString("en-IN", {timeZone: 'Asia/Kolkata',hour12:false});
      var timeNow="";
      if(timeNow1[1]=='/'){
        timeNow+="0"+timeNow1[0]+"/";
        if(timeNow1[3]=="/"){
          timeNow+="0"+timeNow1.substr(2);
        }
        else{
          timeNow+=timeNow1.substr(2); 
        }
      }else{
        timeNow+=timeNow1[0]+timeNow1[1]+"/";
        if(timeNow1[4]=="/"){
          timeNow+="0"+timeNow1.substr(3);
        }
        else{
          timeNow+=timeNow1.substr(3); 
        }
      }
      
      // console.log(timeNow);
      var dateStr=timeNow[6]+timeNow[7]+timeNow[8]+timeNow[9]+timeNow[3]+timeNow[4]+timeNow[0]+timeNow[1];
      var timeStr=timeNow[12]+timeNow[13]+timeNow[15]+timeNow[16]+timeNow[18]+timeNow[19];
      var timeStamp=dateStr+"_"+timeStr;
      // console.log(timeStamp);
      var timeStamp2="";
      for(let i=0;i<8;i++){
        timeStamp2+=(9-timeStamp[i]);
      }
      timeStamp2+="_";
      for(let i=9;i<15;i++){
        timeStamp2+=(9-timeStamp[i]);
      }
      uploadedCounter=0;
      
      for (let i = 0, numFiles = fileList.length; i < numFiles; i++) {
        const file = fileList[i];    
        var selectedlabel = document.getElementById('selected-folder');
        var dept = selectedlabel.options[selectedlabel.selectedIndex].value;      
        // console.log("dept = "+dept+"  date:"+fileDate);
        uploadFile(file,dept,timeStamp2,i,numFiles,fileDate);    
        addProgressBars(i,file.name);
        
      }
    }
    else{
      document.getElementById('noFileSelected').innerHTML="Date not Selected";
    }
  }else{
    document.getElementById('noFileSelected').innerHTML="No Files Selected";
  }  
}

function uploadFile(file,dept,timeStamp2,i,numFiles,fileDate) {                    
      
      var filePath = "/"+dept+"/"+file.name.substring(0,file.name.length-4)+fileDate+".pdf";


      if (file.size < UPLOAD_FILE_SIZE_LIMIT) { // File is smaller than 150 Mb - use filesUpload API
        dbx.filesUpload({path: filePath, contents: file})
          .then(function(response) {
            var results = document.getElementById('results');
            var br = document.createElement("br");
            // results.appendChild(document.createTextNode('File uploaded!'));
            // results.appendChild(br);
            // console.log("uploaded");
            // console.log(response);
            dbx.sharingCreateSharedLink({path: filePath })
            .then(function(res) {
               // console.log(res);
               var storedPath=res.result.path;
               storedPath=storedPath.substr(1,storedPath.lastIndexOf("/")-1);
               var downloadLink=res.result.url;
               downloadLink=downloadLink.substr(0,downloadLink.length-1)+"1";
               // console.log(storedPath)
               // console.log(downloadLink)
               databaseRef.child(timeStamp2).child('url'+i).set(downloadLink);
               databaseRef.child(timeStamp2).child('path').set(storedPath);
               removeProgressBars(i);
               uploadedCounter+=1;
               if(uploadedCounter==numFiles){
                   enableElements();
               } 
               // return res;
             })
            .catch(function(error) {
               console.error(error);
             });
          })
          .catch(function(error) {
            console.error(error);
          });
      } else { // File is bigger than 150 Mb - use filesUploadSession* API
        const maxBlob = 8 * 1000 * 1000; // 8Mb - Dropbox JavaScript API suggested max file / chunk size

        var workItems = [];     
      
        var offset = 0;

        while (offset < file.size) {
          var chunkSize = Math.min(maxBlob, file.size - offset);
          workItems.push(file.slice(offset, offset + chunkSize));
          offset += chunkSize;
        } 
          
        const task = workItems.reduce((acc, blob, idx, items) => {
          // console.log(idx);
          if (idx == 0) {
            // Starting multipart upload of file
            return acc.then(function() {
              return dbx.filesUploadSessionStart({ close: false, contents: blob})
                        .then(response => response.session_id)
            });          
          } else if (idx < items.length-1) {  
            // Append part to the upload session
            return acc.then(function(sessionId) {
             var cursor = { session_id: sessionId, offset: idx * maxBlob };
             return dbx.filesUploadSessionAppendV2({ cursor: cursor, close: false, contents: blob }).then(() => sessionId); 
            });
          } else {
            // Last chunk of data, close session
            return acc.then(function(sessionId) {
              var cursor = { session_id: sessionId, offset: file.size - blob.size };
              var commit = { path: filePath, mode: 'add', autorename: true, mute: false };              
              return dbx.filesUploadSessionFinish({ cursor: cursor, commit: commit, contents: blob });           
            });
          }          
        }, Promise.resolve());
        
        task.then(function(result) {
          // var results = document.getElementById('results');
          // results.appendChild(document.createTextNode('File uploaded!'));
          // console.log("uploadedBig");

          dbx.sharingCreateSharedLink({path: filePath })
            .then(function(res) {
               // console.log(res);
               var storedPath=res.result.path;
               storedPath=storedPath.substr(1,storedPath.lastIndexOf("/")-1);
               var downloadLink=res.result.url;
               downloadLink=downloadLink.substr(0,downloadLink.length-1)+"1";
               // console.log(storedPath)
               // console.log(downloadLink)

               databaseRef.child(timeStamp2).child('url'+i).set(downloadLink);
               databaseRef.child(timeStamp2).child('path').set(storedPath);

               uploadedCounter+=1;
               if(uploadedCounter==numFiles){
                   enableElements();

               }
               // return res;
             })
            .catch(function(error) {
               console.error(error);
             });

        }).catch(function(error) {
          console.error(error);
        });
        
      }
      return false;
    }


function addProgressBars(i,fname){
    var bgbar = document.createElement("div");
    bgbar.id='myProgress'+i;
    bgbar.className='loader';
    // var bar = document.createElement("div");
    // bar.id='myBar'+i;
    // bar.className='progressBar';

    var progressName = document.createElement("div");
    progressName.id='progressBarName'+i;
    progressName.className='progressBarName';
    progressName.innerHTML=fname;
    
    document.getElementById('myProgressBars').appendChild(bgbar);
    // document.getElementById('myProgress'+i).appendChild(bar);
    document.getElementById('progressFileNames').appendChild(progressName);
}

function removeProgressBars(i){
  var removeName=document.getElementById('progressBarName'+i);
  var removebar=document.getElementById('myProgress'+i);
  document.getElementById('myProgressBars').removeChild(removebar);
  document.getElementById('progressFileNames').removeChild(removeName);
}

function disableElements(){
  document.getElementById('mainNav').style.pointerEvents="none";
  document.getElementById('mainNav').style.cursor="default";
  document.getElementById('submitButton').disabled=true;
  document.getElementById('datePick').disabled=true;
  document.getElementById('submitButton').style.opacity=0.7;
  document.getElementById('submitButton').style.cursor="default";
  document.getElementById('selected-folder').disabled=true;
  document.getElementById('selected-files').disabled=true;
}

function enableElements(){
  document.getElementById('mainNav').style.pointerEvents="auto";
  document.getElementById('mainNav').style.cursor="pointer";
  document.getElementById('submitButton').disabled=false;
  document.getElementById('submitButton').style.opacity=1;
  document.getElementById('submitButton').style.cursor="pointer";
  document.getElementById('selected-folder').disabled=false;
  document.getElementById('selected-files').disabled=false;
  document.getElementById('selected-files').value = "";
  document.getElementById('datePick').disabled=false;
  document.getElementById('noFileSelected').innerHTML="Files Uploaded Successfully";
  // removeMainListing();
  // mainListing();  
}
