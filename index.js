//to get analtytic of the url goto /test route
const express = require("express");
const path = require("path");
const urlRoute = require('./routes/url');
const {connectToMongoDB}= require("./connect");
const cookieParser = require('cookie-parser')
const {restrictToLoggedinUserOnly,checkAuth}=require("./middlewares/auth")

const URL = require("./models/url");
const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");

const app = express();
const PORT = 8001;

app.set("view engine", "ejs");
app.set('views', path.resolve("./views"));


connectToMongoDB("mongodb://127.0.0.1:27017/short-url").then(()=> console.log("mongodb connected")  );
app.use(express.json());
app.use(express.urlencoded({extended : false}));
app.use(cookieParser());

app.get("/test", async(req,res)=>{
  const allUrls = await URL.find({});
  return res.render("home",{
    urls: allUrls,
  } );
});

app.use("/url", restrictToLoggedinUserOnly ,urlRoute);
app.use("/user",userRoute);
app.use("/",checkAuth,staticRoute);

app.get("/test",async(req,res)=>{
  const allUrls = await URL.find({});
  return res.end(`{
<html>
<head> </head>
<body>
<ol>  ${allUrls.map(url=>` <li> ${url.shortId}-${url.redirectURL}-${ url.visitHistory.length}</li>` )
.join("")
}  </ol>
</body>
</html>

  }`);
});

 app.get("/url/:shortId",async(req,res)=>{
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate({
    shortId 
  },{ $push :{
    visitHistory:{
        timestamp:Date.now(),
    },
  },
} );
res.redirect(entry.redirectURL);
});


app.listen(PORT,()=> console.log(`Server Started ${PORT}`));
