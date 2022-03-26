
// Set the configuration for your app
// TODO: Replace with your app's config object

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
var storage = firebase.storage();
var storageRef = storage.ref();

var database = firebase.database();
var databaseRef = database.ref().child("uploadedPDF");

var metadata = {
  contentType: 'application/pdf'
};


const inputElement = document.getElementById("selected-files");
inputElement.addEventListener("change", handleFiles, false);
var fileList="";

function filesAreSelected(){
  document.getElementById('noFileSelected').innerHTML="";  
}

function handleFiles() {
  fileList = this.files;
}

function submitFiles() {
  console.log('submit clicked');
  if(fileList.length>0){
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
    
    console.log(timeNow);
    var dateStr=timeNow[6]+timeNow[7]+timeNow[8]+timeNow[9]+timeNow[3]+timeNow[4]+timeNow[0]+timeNow[1];
    var timeStr=timeNow[12]+timeNow[13]+timeNow[15]+timeNow[16]+timeNow[18]+timeNow[19];
    var timeStamp=dateStr+"_"+timeStr;
    console.log(timeStamp);
    var timeStamp2="";
    for(let i=0;i<8;i++){
      timeStamp2+=(9-timeStamp[i]);
    }
    timeStamp2+="_";
    for(let i=9;i<15;i++){
      timeStamp2+=(9-timeStamp[i]);
    }
    var uploadedCounter=0;
    var uploadTask=[];
    for (let i = 0, numFiles = fileList.length; i < numFiles; i++) {
      const file = fileList[i];

      // Upload file and metadata to the object 'images/mountains.jpg'
      var selectedlabel = document.getElementById('selected-folder');
      var dept = selectedlabel.options[selectedlabel.selectedIndex].value;
      console.log("dept = "+dept);
      uploadTask[i] = storageRef.child(dept).child(timeStamp+ file.name).put(file, metadata);
      // uploadTask[i] = storageRef.child(dept).child(dateStr).child(timeStr+ file.name).put(file, metadata);
      addProgressBars(i,file.name);
      // Listen for state changes, errors, and completion of the upload.
      uploadTask[i].on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
        (snapshot) => {
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload of '+i+' is' + progress + '% done');
        
          var perc = 0;
           {
            if (perc == 0) {
              perc = 1;
              var elem = document.getElementById("myBar"+i);
              var width = 1;        
              var id = setInterval(frame, 0);
              function frame() {
                if (width >= 100) {
                  clearInterval(id);
                  perc = 0;
                } else {
                  width++;              
                  elem.style.width = progress + "%";          
                }
              }
            }
          }
          switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
              console.log('Upload is paused');
              break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
              console.log('Upload is running');
              break;
          }
        },
        
        (error) => {
          // A full list of error codes is available at
          // https://firebase.google.com/docs/storage/web/handle-errors
          switch (error.code) {
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              break;
            case 'storage/canceled':
              // User canceled the upload
              break;

            // ...

            case 'storage/unknown':
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        },
        () => {
          // Upload completed successfully, now we can get the download URL
          uploadTask[i].snapshot.ref.getDownloadURL().then((downloadURL) => {
            
            databaseRef.child(dept).child(timeStamp2).child('url'+i).set(downloadURL);
            removeProgressBars(i);
            uploadedCounter+=1;
            if(uploadedCounter==fileList.length){
              enableElements();
            }
          });
        }
      );
    }
  }else{
    document.getElementById('noFileSelected').innerHTML="No Files Selected";
  }  
}


function addProgressBars(i,fname){
    var bgbar = document.createElement("div");
    bgbar.id='myProgress'+i;
    bgbar.className='progressBgbar';
    var bar = document.createElement("div");
    bar.id='myBar'+i;
    bar.className='progressBar';
    var progressName = document.createElement("div");
    progressName.id='progressBarName'+i;
    progressName.className='progressBarName';
    progressName.innerHTML=fname;
    
    document.getElementById('myProgressBars').appendChild(bgbar);
    document.getElementById('myProgress'+i).appendChild(bar);
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
  document.getElementById('noFileSelected').innerHTML="Files Uploaded Successfully";
}