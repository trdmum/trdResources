// Set the configuration for your app
// TODO: Replace with your project's config object
var config = {
    apiKey: "AIzaSyDnStfRyi45PQg_0fWbXSBDA0Kd0V6BS-k",
    authDomain: "pdf-db-8e1a7.firebaseapp.com",
    databaseURL: "https://pdf-db-8e1a7-default-rtdb.firebaseio.com",
    projectId: "pdf-db-8e1a7",
    storageBucket: "pdf-db-8e1a7.appspot.com",
    messagingSenderId: "6672489999",
    appId: "1:6672489999:web:d0551eba5f742319584d7a",
    measurementId: "G-JZ5Z7HNS5F"
  };
  
firebase.initializeApp(config);

// Get a reference to the database service
//var database = firebase.database();

//var databaseRef = database.ref();

function writeUserData() {
    var name= document.getElementById('user').value;
    var password= document.getElementById('password').value;
    if(name==""){
        document.getElementById('success').innerHTML = "Enter Username";
        document.getElementById('success').style.color = "red";    
    }else{
        if(password==""){
        document.getElementById('success').innerHTML = "Enter Password";    
        document.getElementById('success').style.color = "red";    
        }else{
            firebase.database().ref().child('UserAuth').child(name).set(password);
            document.getElementById('user').value = "";
            document.getElementById('password').value = "";
            document.getElementById('success').style.color = "black";    
            document.getElementById('success').innerHTML = "User Added successfully";
        }
    }
}

function clearData(){
    document.getElementById('success').innerHTML = "";   
}

var database = firebase.database();
  var databaseRef = database.ref().child("UserAuth");
databaseRef.on('value', (snapshot) => {
  const data = snapshot.val();
  var i=0;
  removeAll();
  makeTable();
  Object.entries(data).forEach(([key, value]) => {
  i+=1; 
    appendRow(key,value,i);
    console.log("key=",key,"\nvalue=",value);
 });

});

function getElementIndex(i)
{
  console.log(i);
  var elementId=document.getElementById("rowid"+i).value;
  console.log(elementId);
  databaseRef.child(elementId).remove();
}

function removeAll(){
  var mainTable = document.getElementById("mainTable");
  document.getElementById('feedback-table').removeChild(mainTable);
}

function makeTable(){
  var feedbackTable = document.getElementById("feedback-table");
  var mainTable = document.createElement('table');
  mainTable.id="mainTable";
  mainTable.className="table-users";
  feedbackTable.appendChild(mainTable);
}

function appendRow(key,value,i)
{
 var mainTable = document.getElementById("mainTable");
 var tr = document.createElement('tr');
 var td = document.createElement('td');
 td.id="rowid"+i;
 td.value=key;
 td.style.maxWidth="60px";
 td.style.paddingRight="0px";
 td.style.width="30%";
 var idname=key;
 
 td.innerHTML="<div style='color:black;font-weight: bold;font-size:1em;'>"+idname+"</div>";
 td.style.whiteSpace="pre-wrap";
 td.style.wordWrap="break-word";
 // td.style.hyphens="auto";

 console.log("i="+i);
 var td2 = document.createElement('td');
 td2.innerHTML=value;
 td2.style.maxWidth="70px";
 td2.style.width="60%";
 td2.style.whiteSpace="pre-wrap";
 td2.style.wordWrap="break-word";
 td2.style.hyphens="auto";
 td2.style.fontSize="1em";
 td2.style.fontWeight="bold";
 var td3 = document.createElement('td');
 td3.innerHTML='<i class="fa fa-trash-o" style="font-size:1.5em;cursor:pointer;" onclick="getElementIndex('+i+')"></i>';
 td3.style.width="7%";
 td3.style.paddingLeft="0px";
 td3.style.maxWidth='1px';
 // td3.style.cursor="pointer";
 // td3.setAttribute("onclick","getElementIndex("+i+")");
 tr.appendChild(td);
 tr.appendChild(td2);
 tr.appendChild(td3);


 mainTable.prepend(tr);
}
