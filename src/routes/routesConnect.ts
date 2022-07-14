var routes = require('./index');
var woocommerce = require('./api/wc_hook');

// route 모듈 추가 
module.exports = function connectRoutes(app){
    app.use('/', routes);
    app.use('/woocommerce', woocommerce);
};