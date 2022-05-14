
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
  removeMainListing();
  mainListing();  
}

function getElementIndex(filePath)
{
  // console.log(filePath);  
  dbx.sharingGetSharedLinks({path: filePath })
            .then(function(res) {
               // console.log(res);               
               var downloadLink=res.result.links[0].url;
               downloadLink=downloadLink.substr(0,downloadLink.length-1)+"1";               
               // console.log(downloadLink)
               var key1="";
               var key2="";
               databaseRef.on('value', (snapshot) => {
                  const data = snapshot.val();
                  Object.entries(data).forEach(([key]) => {
                    // console.log("key=",key);
                    key1=key;
                    const data2 = snapshot.child(key).val();
                    Object.entries(data2).forEach(([key,value]) => {                                      
                      // console.log("key=",key," val=",value);
                      key2=key;
                      if(value==downloadLink){
                        // console.log("found at "+key1+"/"+key2);

                        databaseRef.child(key1).child(key2).remove();
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
                        databaseRefDel.child(timeStamp2).child('path').set(filePath);
                        deleteItems(filePath);
                      }     
                    });
                 });
                });
               })
        .catch(function(error) {
          console.error(error);
        });
  
}

function addToList(files,id,level){
    var filesList = document.getElementById(id);    
      // console.log(id)  
      var ul=document.createElement('ul');      
      ul.className='cd-accordion__sub cd-accordion__sub--l'+level;
      for (var i = 0; i < files.length; i++) {
        var li = document.createElement('li');
        if(files[i].name.endsWith("pdf")){
          li.className='cd-accordion__item';
          var filePath="'"+files[i].path_display.substring(0)+"'";          
          li.innerHTML='<div class="cd-accordion__label cd-accordion__label--icon-img"><i class="fa fa-trash-o" style="font-size:1.5em;cursor:pointer;" onclick="delPopUp2('+filePath+');"></i><span>'+files[i].name+'</span></div>';
        }        
        ul.appendChild(li);
      }
      filesList.parentElement.appendChild(ul);  
      return 1;
}

async function listItems(dept,id,level){
    dbx.filesListFolder({path: dept})
        .then(function(response) {
          // console.log('response', response)
          return addToList(response.result.entries,id,level);          

        })
        .catch(function(error) {
          console.error(error);
        });
}

function deleteItems(filePath){

    dbx.filesDeleteV2({path: filePath})
        .then(function(response) {
          // console.log('response', response)          
          removeMainListing();
          mainListing();      
        })
        .catch(function(error) {
          console.error(error);
        });
    
}

function mainListing(){
      var id="grp1"
      var level=1
      var filesList = document.getElementById(id);    
      var files=["ACTM","IRSOD","OHE_PSI","Safety","HQ","Implantation",
          "Miscellaneous","TIIN","TIMI"]  
      var ul=document.createElement('ul');      
      ul.className='cd-accordion__sub cd-accordion__sub--l'+level;
      for (var i = 0; i < files.length; i++) {
        var li = document.createElement('li');            
        li.className='cd-accordion__item cd-accordion__item--has-children';         
        var input=document.createElement('input');
        input.className='cd-accordion__input';
        input.type='checkbox';
        input.id=files[i]+level+'-'+i;
        var label=document.createElement('label');
        label.className='cd-accordion__label cd-accordion__label--icon-folder';
        label.htmlFor=files[i]+level+'-'+i;
        label.innerHTML='<span>'+files[i]+'</span>'
        li.appendChild(input);
        li.appendChild(label);          
        ul.appendChild(li);
      }
      filesList.parentElement.appendChild(ul);  
      addFirstToList(files);
      subListing(files);
}

function addFirstToList(files){

  var lsfiles= [['Correction slips',
                'Vol I',
                'Vol II Part I',
                'Vol. II Part II'],

                ['Correction Slips',
                 'Revised IR SOD 2004.pdf',
                 'Technical Aid to IR SOD.pdf'],

                ['OHE & PSI Parameters.pdf'],

                ['Safety.pdf'],

                ['Instruction No 2021-0104.01.2021.pdf',
                 'Instruction No 2021-0225.02.2021.pdf',
                 'Instruction No 2021-0301.03.2021.pdf',
                 'Instruction No 2021-0428.04.2021.pdf',
                 'Instruction No 2021-0528.04.2021.pdf',
                 'Instruction No 2021-0628.07.2021.pdf',
                 'Instruction No 2021-0709.08.2021.pdf',
                 'Instruction No 2021-0801.11.2021.pdf',
                 'Instruction No 2021-0902.11.2021.pdf'],
               
                ['OHE foundation for increased implantation 26.03.2012.pdf',
                 'Standard Implantation for new electrification works 03.11.2010.pdf',
                 'Standard Implantation for new electrification works 26.02.2010.pdf',
                 'Standard implantation in future electrification works 14.11.2006.pdf',
                 'Standards for implantation to be adopted for RE 17.09.2008.pdf'],
              
                ['Codal life TRD.pdf',
                 'Corrosion resistant paint system for outdoor structure of TRD 23.05.2012.pdf',
                 'Revised Codal Life of Assets 22.08.2012.pdf',
                 'Use of Insulation paint on overline structure.pdf'],

                ['Index.pdf',
                 'TI IN 0001 Rev 0 Instruction for Booster Transformer _ return conductors 27.05.1994.pdf',
                 'TI IN 0002 Rev 0 Design of fixed shunt compensation for improving power factor at TSS 01.01.1997.pdf',
                 'TI IN 0007 Rev 0 Action to be taken in case of failure of 25kv solid core porcelain Insulator 17.09.2001.pdf',
                 'TI IN 0008 Rev 0 Use of copper cross feeders at switching station 28.09.2001.pdf',
                 'TI IN 0009 Rev 0 Splicing of 193.99 mm Aluminum conductor (spider) 01.10.2001.pdf',
                 'TI IN 0012 Rev 0 Action to be taken for failure prone insulators, insulators suspected to be failure prone and those to retained in service 13.12.2005.pdf',
                 'TI IN 0013 Rev 0 Handling of composite insulators 19.12.2005.pdf',
                 'TI IN 0014 Rev 0 Use of Dynamic reactive Power compensation (DRPC) on Indian Railways 03.04.2007.pdf',
                 'TI IN 0015 Rev 0 Application of lubrication on wire rope used with ATD 01.02.2010.pdf',
                 'TI IN 0016 Rev 0 Parallel operation of traction transformer on IR 01.06.2008.pdf',
                 'TI IN 0017 Rev 0 Protection scheme with parallel operation of 2x21.6 MVA traction transformer 01.07.2008.pdf',
                 'TI IN 0018 Rev 0 Existing panto flash over relay at TSS for single line section on IR 23.01.2009.pdf',
                 'TI IN 0019 Rev 0 Load profile, current _ voltage harmonics measurement _ recording in TSS 29.09.2009.pdf',
                 'TI IN 0021 Rev 0 Increasing data transfer speed of the SCADA system on IR from 600 1200 bps to 9600 bps 01.01.2010.pdf',
                 'TI IN 0022 Rev 0 Traction transformer & 25 KV shunt capacitor bank protection relay developed as per RDSO specification no. TISPC PSI PROTCT6070(0908) for 25 KV AC TSS 02.02.2010.pdf',
                 'TI IN 0023 Rev 0 Operating RTUs with power supply of 110 V DC (in place of 240 V AC) for existing SCADA 09.02.2010.pdf',
                 'TI IN 0024 Rev 0 Monitoring _ analysis of Feeder CB Tripping for 25 KV AC Traction systems 01.06.2010.pdf',
                 'TI IN 0025 Rev 0 Technical Instructions for improving reliability of traction SCADA systems on IR 13.08.2010.pdf',
                 'TI IN 0027 Rev 0 Maintenance practices to be adopted for numerical microprocessor based protection relay 25.10.2010.pdf',
                 'TI IN 0028 Rev 0 Feeder CB backup feature in different makestypes of feeder protection modules provided in C & R panels as per old RDSO Spec. No. ETIPSI65 (0197) 12.12.2010.pdf',
                 'TI IN 0029 Rev 0 Important aspects of relay settings of Vectorial Delta-I relays as per RDSO Specification No. TISPCPSIPROTCT1982 21.04.2011.pdf',
                 'TI IN 0030 Rev 0 Installation and commissioning of the 42 KV metal oxide gapless lightning arresters 06.05.2011.pdf'],

                ['Index.pdf',
                 'TI MI 0001 Rev 0 Failure of 25 kv pedestal insulator and use only solid core support insulator 23.10.1982.pdf',
                 'TI MI 0007 Rev 0 Use of disk insulator in place of 9T solid core insulators 04.06.1984.pdf',
                 'TI MI 0008 Rev 0 Failure of 9T insulator due to non provision of double eye distance rod at BWA 14.09.1984.pdf',
                 'TI MI 0011 Rev 1 25 KV solid core Insulators before Installation 25.05.2001.pdf',
                 'TI MI 0018 Rev 3 Winch type regulating equipment 01.04.2006.pdf',
                 'TI MI 0026 Rev 2 Periodical maintenance instruction _ trouble shooting guidelines for capacitor bank 10.07.2003.pdf',
                 'TI MI 0027 Rev 0 Development of 107 mm2 silver bearing copper contact wire- Silver contents 0.103.03.1998.pdf',
                 'TI MI 0028 Rev 2 OHE on turn outcross over to avoid panto entanglements 28.09.2001.pdf',
                 'TI MI 0029 Rev 3 3 Pulley type regulating equipment 01.04.2006.pdf',
                 'TI MI 0031 Rev 0 Earth station setup at switching Posts SSP _ SP 01.04.2013.pdf',
                 'TI MI 0032  Rev 1 Earthing Station at Switching Posts SSP _ SP 01.04.2014.pdf',
                 'TI MI 0034 Rev 0 Contact wire in out of run (OOR) OHE 01.06.1999.pdf',
                 'TI MI 0035 Rev 1 Provision of pipe on HEX Tie Rod of auto Tensioning Device (ATD) 28.09.2001.pdf',
                 'TI MI 0036 Rev 0 Insulated cadmium Copper catenary wire under OLS 08.08.1999.pdf',
                 'TI MI 0037 Rev 2 Maintenance instruction for OHE contact wire and associated fittings 21.10.2002.pdf',
                 'TI MI 0038 Rev 2 Inspection test schedule for traction power transformer 05.05.2006.pdf',
                 'TI MI 0039 Rev 1 Periodic Overhaul of Traction Transformer 01.10.2003.pdf',
                 'TI MI 0040 Rev 0 Measuring the severity of pollution by brush wash method 05.04.2005.pdf',
                 'TI MI 0041 Rev 1 Condition monitoring of Lightening Arresters 08.04.2010.pdf',
                 'TI MI 0042 Rev 0 Testing of 25 KV porcelain _ composite insulators before installation 12.12.2008.pdf',
                 'TI MI 0043 Rev 0 Instruction for 8-wheeler tower wagons covering instructions for DETC _ DHTC 01.08.2008.pdf',
                 'TI MI 0044 Rev 0 Hopperchutecrane loadingunloading of rakes in electrified sidings 28.01.2009.pdf',
                 'TI MI 0044 Rev 0 Special Maintenance instruction for 4 wheeler tower car 15.11.2012.pdf',
                 'TI MI 0045 Rev 0 Maintenance instructions for Gas Auto tensioning device 01.11.2009.pdf',
                 'TI MI 0047 Rev 0 Precautions while splicing insulated Cadmium-Copper catenary wire 26.09.2012.pdf',
                 'TI MI 0048 Rev 0 Provision of dis connector assembly to the lightning arresters 08.08.2013.pdf']]

  var ACTM1=[['ACTM CS 01 - Ensuring Power Supply.pdf',
              'ACTM CS 02 - Energisation.pdf',
              'ACTM CS 03 - Training.pdf',
              'ACTM CS 04 - Tree Trimming.pdf',
              'ACTM CS 05 - Crossing Clearance.pdf',
              'ACTM CS 06 - Locos.pdf',
              'ACTM CS 07 - Safety Measures in case of UOR.pdf',
              'ACTM CS 08 - EMU-MEMU.pdf',
              'ACTM CS 09 - Tree cutting with Engg..pdf',
              'ACTM CS 10 - LC Gauges.pdf',
              'ACTM CS 11 - Safety Measures in case of UOR.pdf',
              'ACTM CS 12 - Speed Restrictions.pdf',
              'ACTM CS 13 - EMU-MEMUs Inspections.pdf',
              'ACTM CS 14 - Electrical Clearances.pdf',
              'ACTM CS 15 - Vertical Clearances for power line crossings.pdf',
              'ACTM CS 16 - Vertical Clearances for power line crossings.pdf',
              'ACTM CS 17 - EIG Energisation.pdf',
              'ACTM CS 18 - Vertical Clearance for power line crossings.pdf',
              'ACTM CS 19 - Anti-theft energisation duration.pdf',
              'ACTM CS 20 - Implantation.pdf',
              'ACTM CS 21 - Energisation.pdf',
              'ACTM CS 22 - Safety Certificates.pdf',
              'ACTM CS 23 - Minimum Horizontal distance from centre line of track.pdf',
              'ACTM CS 24 -Competency Certifiction to pointsmen for isolator operation.pdf',
              'ACTM CS 30 - LC Height.pdf',
              'ACTM CS 31 - Isolator operation _ modification in TR-1 Competency certificate.pdf',
              'ACTM CS 32 - LC Height.pdf',
              'ACTM CS 33 - Traction masts near Level Crossings.pdf'],

             ['ch01 - MANAGEMENT OF AC TRACTION.pdf',
              'ch02 - GENERAL DESCRIPTION OF ELECTRIC ROLLING STOCK.pdf',
              'ch03 - GENERAL DESCRIPTION OF FIXED INSTALLATIONS.pdf',
              'ch04 - SAFETY PRECAUTIONS ON ELECTRIFIED SECTIONS.pdf',
              'ch05 - ELECTRICAL ACCIDENTS.pdf',
              'ch06 - FIRE PRECAUTIONS.pdf',
              'ch07 - ENERGY CONSERVATION.pdf',
              'ch08 - TRACTION STORES AND THEIR ACCOUNTAL.pdf',
              'ch09 - QUALITY ASSURANCE & RELIABILITY ENGINEERING.pdf',
              'ch10 - SURVEYS, ESTIMATES & PROGRAMMES.pdf',
              'ch11 - DOCUMENTS FOR REFERENCE.pdf',
              'ch12 - MISCELLANEOUS INSTRUCTIONS.pdf'],

             ['ch01 Power supply for traction.pdf',
              'ch02 Sub stations and switching stations.pdf',
              'ch03 Overhead equipments.pdf',
              'ch04 Remote control equipments.pdf',
              'ch05 Operation of traction power control.pdf',
              'ch06 Power blocks and permits to work.pdf',
              'ch07 Signalling _ telecommunications and permanent way installations in electrified sections.pdf',
              'ch08 Breakdowns.pdf',
              'ch09 Preparations for commissioning.pdf',
              'ch10 Commissioning of electric traction.pdf',
              'ch11 Recent developments.pdf',
              'ch12 Training and competency certificates.pdf'],

             ['App 01 - Principles for layout plans and sectioning diagrams for 25 kV AC traction.pdf',
              'App 02 - Codes for bonding and earthing for 25 kV, AC, 50Hz, single phase traction system.pdf',
              'App 03 - Codes of practice for earthing of power supply installations  for 25 kV, AC, 50 Hz.pdf',
              'App 04 - Regulations for power line crossings of railway tracks .pdf',
              'App 05 - Guidelines for relay setting at traction sub stations and  sectioning posts .pdf',
              'App 06 - Guidelines for provision of maintenance depots, T_P and transport facilities.pdf',
              'App 07 - General guidelines for anti-theft charging of OHE .pdf',
              'App 08 - Model circulars .pdf',
              'App 09 - List of specifications and drawings for equipments and   materials for railway electric traction.pdf',
              'App 10 - 25 kV OHE diagrams of general arrangement and fittings .pdf',
              'App 11 - Electrification of private and assisted sidings.pdf']]

  var IRSOD1=['ACS 01 Station Yard Construction.pdf',
              'ACS 02 Station Yard Construction (Revised).pdf',
              'ACS 03 General Corrections _ Diagram Corrections.pdf',
              'ACS 05 Station Yard Schedule.pdf',
              'ACS 06 Rolling Stock.pdf',
              'ACS 07 Clearance of FOBs, ROBs _ Power line crossings.pdf',
              'ACS 08 Length of Sidings.pdf',
              'ACS 09 Spacing of Track.pdf',
              'ACS 10 Clearance of FOBs, ROBs _ Power line crossings.pdf',
              'ACS 11 Horizontal Distances.pdf',
              'ACS 12 Station Yards.pdf',
              'ACS 13 Height of FOB ROB.pdf',
              'ACS 14 Rolling Stock.pdf',
              'ACS 15 Station Yards.pdf',
              'ACS 16 Steepest Gradient in station yard.pdf',
              'ACS 17 Station Yard.pdf',
              'ACS 18 Track Spacing.pdf',
              'ACS 19 Station Yard.pdf',
              'ACS 20 Power line crossing clearances.pdf',
              'ACS 21 High Rise OHE.pdf',
              'ACS 22 Height of ROB FOB.pdf',
              'ACS 23 Horizontal Distances.pdf',
              'ACS 24 Horizontal Distances.pdf',
              'ACS 25 General Corrections.pdf',
              'ACS 26 Track Spacing.pdf',
              'ACS 27 General Corrections.pdf',
              'ACS 28 Gradient.pdf',
              'ACS 29 Maximum Gradient.pdf',
              'ACS 30 Track Spacing.pdf',
              'ACS 31 Deletion.pdf',
              'ACS 32 General Corrections.pdf']            
  for (var i = 0; i < files.length; i++) {
    addToList2(lsfiles[i],files[i]+'1-'+i,2);
  }
  for(var i = 0; i < ACTM1.length; i++){
    addToList2(ACTM1[i],lsfiles[0][i]+'2-'+i,3);
  }
  addToList2(IRSOD1,lsfiles[1][0]+'2-'+0,3);
}

function addToList2(files,id,level){
      var filesList = document.getElementById(id);    
      // console.log(id)  
      var ul=document.createElement('ul');      
      ul.className='cd-accordion__sub cd-accordion__sub--l'+level;
      for (var i = 0; i < files.length; i++) {
        var li = document.createElement('li');        
        if(files[i].endsWith("pdf")){
          li.className='cd-accordion__item';        
          li.innerHTML='<div class="cd-accordion__label cd-accordion__label--icon-img"><i class="fa fa-trash-o" style="font-size:1.5em;cursor:pointer;"onclick="delPopUp();"></i><span>'+files[i]+'</span></div>';              
        }
        else{
          li.className='cd-accordion__item cd-accordion__item--has-children';            
          var input=document.createElement('input');
          input.className='cd-accordion__input';
          input.type='checkbox';
          input.id=files[i]+level+'-'+i;
          var label=document.createElement('label');
          label.className='cd-accordion__label cd-accordion__label--icon-folder';
          label.htmlFor=files[i]+level+'-'+i;
          label.innerHTML='<span>'+files[i]+'</span>'
          li.appendChild(input);
          li.appendChild(label);                  
        }
        ul.appendChild(li);
      }
      filesList.parentElement.appendChild(ul);  
      return 1;
}

function subListing(files){
  // console.log("ss")
  for (var i = 0; i < files.length; i++) {
    listItems('/'+files[i]+'/',files[i]+'1-'+i,2);
  }  
}

function removeMainListing(){
  var filesList = document.getElementById('grp1');
  filesList.parentElement.innerHTML='<ul class="cd-accordion cd-accordion--animated margin-top-lg margin-bottom-lg" style="box-shadow:none">'+
      '<li class="cd-accordion__item cd-accordion__item--has-children">'+     
      '<input class="cd-accordion__input" type="checkbox" id="grp1">'+
      '<label class="cd-accordion__label cd-accordion__label--icon-folder" for="grp1"><span>UPLOADED FILES</span></label>'+
      '</li></ul>';
}

function delPopUp(){
  document.getElementById('popid01').style.display='block';
}

var currentFilePath="";

function delPopUp2(filePath){
  document.getElementById('popid01').style.display='block';
  currentFilePath=filePath;
}

var modal = document.getElementById('popid01');
function clearData(){
  if(document.getElementById('userInput').value=="delete me"){
    console.log("delete haha");
    document.getElementById('popid01').style.display='none';
    if(currentFilePath.length>0){ 
      getElementIndex(currentFilePath);
    }else{
      console.log("not deleted");
    }
  }
  clearText();
}

function clearText(){
  currentFilePath="";
  document.getElementById('userInput').value="";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}