var s = location.hash;
let p1 = s.search("access_token");
let p2 = s.search("&token");
p1+=13;
console.log("here:"+s)
access_token=s.substring(p1,p2);
console.log("token:"+s.substring(p1,p2))
sessionStorage.setItem('access_token',access_token);