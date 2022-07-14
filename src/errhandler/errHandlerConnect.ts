import { isCelebrate } from "celebrate";
import Logger from '../logger';
module.exports = function connectErrorHandlers(app) {
  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    // var err = new Error("Not Found");
    res.status(404).send('Sorry cant find page!')
    // next(err);
  }); // 404 에러가 떳을때 에러 메시지

  // development error handler
  // will print stacktrace
  if (app.get("env") === "development") {
    app.use(function (err, req, res, next) {
      if (!err) {
        next();
        return;
      }
      if (isCelebrate(err)) {
        Logger.error("celebrate error!");
        res.status(400).send(`Error code 400 : ${err}`);
      } else {
        Logger.error("dev error", err);
        res.status(err.status || 500).send( `${err.status} ${err}` || "500 Error");// 404가 아니면 500
      }
    });
  } else {
    // staging or production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
      if (!err) {
        next();
        return;
      }
      Logger.error(`prod error`, err);
      res.status(err.status || 500).json({
        message: err.message,  // error
        error: {}, //에러 메시지를 감춤
      });
    });
  }
};
