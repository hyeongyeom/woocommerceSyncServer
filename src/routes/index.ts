import { Document } from "mongoose";

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  // res.send(res);
  res.status(200).json({
    msg: "hello stranger" 
  });
 
});

router.get('/healthCheck', function(req, res) {
  // res.send(res);
  console.log("/healthCheck");
  res.status(200).json({
    msg: "hello healthCheck"
  });
});




module.exports = router; 