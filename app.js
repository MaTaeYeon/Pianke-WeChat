'use strict';
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var AV = require('leanengine');
//解析url
var url = require('url');
var querystring = require('querystring');

var app = express();

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云函数定义
require('./cloud');
// 加载云引擎中间件
app.use(AV.express());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var ordernumber = Date.now();//定义订单号

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/make', function(req, res) {
  ordernumber = Date.now();
  res.render('make');
});

app.get('/pay', function(req, res) {
  res.render('pay');
});

app.get('/payfinish', function(req, res) {
  res.render('payfinish');
});

app.get('/adminpic', function(req, res) {
  res.render('adminpic');
});



//图片上传模块
var multiparty = require('multiparty');

var fs = require('fs');
app.post('/uploadimages', function(req, res){
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    var iconFile = files.iconImage[0];
    if(iconFile.size !== 0){
      fs.readFile(iconFile.path, function(err, data){
        if(err) {
          return res.send('读取文件失败');
        }
        var theFile = new AV.File(iconFile.originalFilename, data);

        var TestObject = AV.Object.extend('DataTypeTest');
        var testObject = new TestObject();
        testObject.set('pic', theFile);
        testObject.set('ordernumber', ordernumber);
         testObject.save().then(function(testObject) {
            // 成功
            console.log("upload images sucess!");
          }, function(error) {
            // 失败
          });
        theFile.save().then(function(theFile){
          res.send('上传成功！');
        }).catch(console.error);
      });
    } else {
      res.send('请选择一个文件。');
    }
  });
});



app.get('/getordernumber',function(req,res){
  res.json({"ordernumber":ordernumber});
});



//订单信息模块
app.get('/uploaduserinfo', function(req, res){
  var query = url.parse(req.url).query;
  var title = querystring.parse(query).title; 
  var province = querystring.parse(query).province; 
  var address = querystring.parse(query).buyeraddress;
  var name = querystring.parse(query).buyername;  
  var tel = querystring.parse(query).buyertel;

        var nodemailer = require('nodemailer');
        var transporter = nodemailer.createTransport({
            //https://github.com/andris9/nodemailer-wellknown#supported-services 支持列表
            service: 'qq',
            port: 465, // SMTP 端口
            secureConnection: true, // 使用 SSL
            auth: {
                user: '446075198@qq.com',
                //这里密码不是qq密码，是你设置的smtp密码
                pass: 'rixzjylntbmlbgfj'
            }
        });

        // NB! No need to recreate the transporter object. You can use
        // the same transporter object for all e-mails

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: '446075198@qq.com', // 发件地址
            to: '279400766@qq.com', // 收件列表
            subject: '[片刻]来自'+name+'的新订单', // 标题
            //text和html两者只支持一种
            html: '<br>订单号：'+ordernumber+'</br>'+'<br>客户姓名：'+name+'</br>'+'<br>地址：'+address+'</br>'+'<br>电话：'+tel+'</br>', // 标题
            //html: '<b>Hello world ?</b>' // html 内容
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);

        });


  var TestObject = AV.Object.extend('DataTypeTest');
        var testObject = new TestObject();
        testObject.set('title', title);
        testObject.set('province', province);
        testObject.set('address', address);
        testObject.set('name', name);
        testObject.set('tel', tel);
        testObject.set('ordernumber', ordernumber);


      
         testObject.save().then(function(testObject) {
            // 成功
            console.log("uploaduserinfo sucess!");

                  var orderObject = AV.Object.extend('orderObject');
                  var orderObject = new orderObject();
                  orderObject.set('title', title);
                  orderObject.set('province', province);
                  orderObject.set('address', address);
                  orderObject.set('name', name);
                  orderObject.set('tel', tel);
                  orderObject.set('ordernumber', ordernumber);
                  orderObject.save().then(function(orderObject) {
                    // 成功
                  }, function(error) {
                    // 失败
                  });

                  var TestObject = AV.Object.extend('DataTypeTest');
                  var testObject = new TestObject();
                  testObject.set('title', "---");
                  testObject.set('province', "---");
                  testObject.set('address', "---");
                  testObject.set('name', "---");
                  testObject.set('tel', "---");
                  
                  testObject.save().then(function(testObject) {
                      // 成功
                      console.log("------------------------");
                    }, function(error) {
                      // 失败
                    });

            res.redirect('pay');
          }, function(error) {
            // 失败
            res.render('/');
          });
         
});

app.get('/downloadpic',function(req,res){
  var mquery = url.parse(req.url).query;
  var ordernum = querystring.parse(mquery).ordernum; 
  var query = new AV.Query('DataTypeTest');
  // 查询 priority 是 0 的 Todo
  query.equalTo('ordernumber',parseInt(ordernum));
  query.find().then(function (results) {
    console.log(results.length);
  	var add = '<br>全部复制到迅雷即可一键下载！</br>' ;
  	for(var i=0;i<results.length;i++){

  		var downloadurl = eval(results[i]._serverData.pic.attributes);
      //console.log(downloadurl.url);
  		add = add+'<br>'+downloadurl.url+'</br>';
      //console.log(i);
      if(results.length==(i+2))res.send(add);
 	 }
 	 // var downloadurl = eval(results[0]._serverData.pic.attributes);
 	 //  console.log(downloadurl.url);
  	  
  }, function (error) {
  });

  
});

// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);

app.use(function(req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) { // jshint ignore:line
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if(statusCode === 500) {
    console.error(err.stack || err);
  }
  if(req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {}
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

module.exports = app;
