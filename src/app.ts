import express from 'express';
import logger from './logger';
import config from './config';
import { Consumer } from 'sqs-consumer';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import AWS from 'aws-sdk'
import { WC_DATA, WC_CUSTOM } from './models/wc_data'
const { PauseHook, AcitvateHook } = require('./routes/module/hook')
const { default: PQueue } = require('p-queue');
const Product = require('./models/product')
const cors = require('cors');
const connectMongoDB = require('./db/mongoConnect');
const connectRoute = require('./routes/routesConnect');
const connectErrorHandlers = require('./errhandler/errHandlerConnect');
const app = express();
app.use(cors());
app.set('env', config.env || 'development');
const rawBodySaver = (req, res, buf, encoding) => {
    console.log(buf);
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
};
app.use(express.json({ limit: '50mb', verify: rawBodySaver }));
app.use(express.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(express.raw({ verify: rawBodySaver }));

function startApp(app) {
    app.listen(config.port, function (err) {
        if (err) {
            logger.error(`Error creating server at port: ${config.port}`);
            process.exit(1);
        }
        logger.info(`Server listening on port: ${config.port}`)
        console.log(`Server listening on port: ${config.port}`);
    });
}
//몽고db 연결
connectMongoDB(app, function (err) {
    if (err) {
        logger.info(`connect fail to mongodb`);
        logger.info(err);
        process.exit(1);
    }
    console.log("mongodb connected...")
    connectRoute(app);
    connectErrorHandlers(app);
    startApp(app);
});

// 우커머스 api setting
const WooCommerce = new WooCommerceRestApi({
    url: config.woocommerce.url,
    consumerKey: config.woocommerce.consumerKey,
    consumerSecret: config.woocommerce.consumerSecret,
    version: "wc/v3"
});

// SQS URL setting 
const QueueUrlToWc = config.aws.sqs_to_wc_url; //전처리서버 쪽에서 메시지를 받아 WC에 보내는 SQS APP
const QueueUrlForMongo = config.aws.sqs_from_wc_url; //WC에서 Response 받은 데이터를 몽고db에 update하기 위한 SQS APP


//AWS sdk setting(sqs 사용 위함)
AWS.config.update({
    region: config.aws.aws_region,
    accessKeyId: config.aws.access_key_id,
    secretAccessKey: config.aws.secret_access_key
});

const sqsClient = new AWS.SQS();
const { sendBatchedMessages } = require("sqs-bulk-loader")(sqsClient); // bulk로 sqs에 보내는 라이브러리
const wpTaskQueue = new PQueue({ concurrency: 3 }); //Priority queue 라이브러리 동시3개 처리

/*------------------------여기서부터 메시지 처리 로직 시작------------------------*/

let hook_flag: boolean = true  /*훅 일시정지/활성화 기준*/
let p_queue_temp = []  /*priority queue에 보내기 위한 임시 배열*/
let last_msg_chk = 0 /*마지막메시지 확인하기 위한 갯수 체크용*/

//전처리 서버에서 sqs로 보낸 메시지를 받아오는 sqs consumer
const sqsAppForWc = Consumer.create({
    queueUrl: QueueUrlToWc,
    waitTimeSeconds: 20,
    pollingWaitTimeMs: 1500,
    batchSize: 10, /*10개가 최대임*/
    handleMessageBatch: async (messages: any[]) => {
        if (hook_flag) {
            logger.info("sqsAppForWc start")
            hook_flag = await PauseHook()//훅 정지 후 다음로직 진행
        }
        for (let message of messages) {
            p_queue_temp.push(message)
        } // 오는대로 뒤에 붙임
        last_msg_chk += messages.length
        if (p_queue_temp.length >= 90) {
            let messageToWp = p_queue_temp.splice(0, 100)
            wpTaskQueue.add(async () => {
                return CreateToWP(messageToWp)
            })
        }
    },
    sqs: sqsClient
});

wpTaskQueue.on('error', error => {
    logger.error(`p-queue app error : [${error}] `)
});

// sqsAppForWc의 마지막 메시지까지 모두 전달된 후 임시배열에 90개 이상이 되지 않더라도
// 대기열이 모두 비워있다('empty')를 기준으로 발동하여 나머지 메시지도 WC에 보냄 
sqsAppForWc.on('empty', async () => {
    if (p_queue_temp.length !== 0 && wpTaskQueue.pending <= 4) {
        logger.info(`총 ${last_msg_chk}개 메시지를 SyncApp에서 받았습니다.`)
        let left_message = p_queue_temp.splice(0, 100)
        wpTaskQueue.add(async () => {
            logger.info(left_message.length + "개의 마지막으로 남은 메시지 WC에 전송완료")
            FinalCheck() //마지막에 처리 안된 메시지 다시 처리
            return CreateToWP(left_message)
        })
    }
    console.log("queue is empty")
})

// 우커머스로 보낼 데이터 전달 sqs app에서 에러 발생시
sqsAppForWc.on('error', (err) => {
    logger.error(`sqsAppForWc message recieve error : [${err}]`)
});
sqsAppForWc.on('processing_error', (err) => {
    logger.error(`sqsAppForWc message recieve processing error : [${err}]`)
});


//redis page_url 기준 처리된 메시지 갯수(처리갯수 확인용)
// sqsApp_update_wc에서 메시지 받아서 wocommerce_id 기준으로 나눈 후 WC에 batch upload,
// 이후 WC로부터 받은 Response 정보를 SendToSqsMongoApp로 보내는 함수
let CreateToWP = async function (wc_messages: any[]) {
    let data_batch = {
        create: [],
        update: [],
        delete: []
    };
    for (let messages of wc_messages) {
        let message = JSON.parse(messages.Body)
        let wc_id_chk = message.woocommerce_id
        let origin_price = message.dynamic.product_origin_price
        let sale_price = message.dynamic.product_price
        let category = message.static.categories
        if (origin_price == 0) {
            origin_price = sale_price    /*origin_price가 0이면 sale_price가 안들어감(sale_price는 origin_price보다 작아야 함)*/
        }
        let temp = []
        let categories = []
        // 동일 product 데이터 처리방법: lastmodified = -1  기존DB에는 있으나, 새로 수집이 되지 않음 | lastmodified=0 기존DB와, 새로 수집된 상품이 변경사항이 없음 | lastmodified=1 새로 수집된 상품 값이, 기존DB와 다름 → update, create 필요
        switch (message.lastModified) {
            case -1:
                data_batch['delete'].push(wc_id_chk)
                continue
            case 0:
                last_msg_chk -= 1
                continue

        }
        let category_keys = Object.keys(category[0])
        for (let i = 0; i < category_keys.length; i++) {
            temp.push([])
            for (let j of category) {
                temp[i].push(j[category_keys[i]])
            }
        }
        for (let k of temp) {
            const joined_category = k.join()
            categories.push(joined_category)
        }
        let data = new WC_DATA(message, origin_price, sale_price, categories) //우커머스에 보낼 데이터 객체
        if (wc_id_chk === "") { /* woocommerce_id 기준으로 create/update 나누기 */
            data_batch['create'].push(data)
        } else {
            data_batch['update'].push(data)
        }
    }
    return SendToWc(data_batch)
}

let count = 1  /*sqs에 임의로 id를 넣어줘야해서 필요함 */
const SendToWc = function (data_batch) {
    WooCommerce.post("products/batch", data_batch)
        .then((res) => {
            let send_messages = [];
            let res_data = res.data
            if (res_data.create !== undefined) {
                for (let i of res_data.create) {
                    if (i.error) {
                        last_msg_chk -= 1
                        continue
                    }
                    send_messages.push({
                        "Id": `${count}`,
                        "MessageBody": `${JSON.stringify(i)}`
                    })
                    count += 1
                }
            }
            if (res_data.update !== undefined) {
                for (let j of res_data.update) {
                    if (j.error) {
                        Product.deleteOne({ 'woocommerce_id': j.id }).catch((err) => {
                            logger.error('update woocommerceno exist delete error')
                        })
                        last_msg_chk -= 1
                        continue
                    }
                    send_messages.push({
                        "Id": `${count}`,
                        "MessageBody": `${JSON.stringify(j)}`
                    })
                    count += 1
                }
            }
            if (res_data.delete !== undefined) {
                for (let k of res_data.delete) {
                    let wc_id = k.id
                    let delete_chk = {
                        id: `${wc_id}`,
                        lastModified: -1
                    }
                    if (k.error) {
                        Product.deleteOne({ 'woocommerce_id': wc_id }).catch((err) => {
                            logger.error('delete woocommerce no exist delete error')
                        })
                        last_msg_chk -= 1
                        continue
                    }
                    send_messages.push({
                        "Id": `${count}`,
                        "MessageBody": `${JSON.stringify(delete_chk)}`
                    })
                    count += 1
                }
            }
            // WC로부터 response 받은 값을 'sqsAppFormongoDB'에 보냄
            return SendToSqsMongoApp(send_messages)
        })
        .catch((error) => {
            last_msg_chk -= data_batch.length
            logger.error(`woocommerce api batch-create error : [${error.response.data}]`)
        })
};
const SendToSqsMongoApp = function (send_messages) {
    return sendBatchedMessages(QueueUrlForMongo, send_messages)
        .catch((error) => {
            logger.error(`send Batch Messages to sqsApp for mongo error : [${error}]`)
        })
};


// 메시지 처리가 모두 끝난 후 에러로 인해 몽고db에 woocommerce_id, wc_custom을 못 넣어준 경우 재시도
const FinalCheck = async function () {
    const ExecTime = 1000 * 3600
    logger.info(`${ExecTime / 60000}분 후 Finalcheck 예약`)
    setTimeout(async () => {
        let failUpdateProduct = await Product.find({ woocommerce_id: "" })
        if (failUpdateProduct.length == 0) {
            logger.info("에러없이 모두 처리 되었습니다.");
            return
        }
        logger.info('NO Wocommerce id update retry start num : ' + failUpdateProduct.length)
        for (let i of failUpdateProduct) {
            let title = i.static.product_title
            logger.info('오류난 메시지 title : ' + title)
            let page_url = i.page_url
            const param = {
                search: title
            }
            await WooCommerce.get('products', param).then(async (res) => {
                if (res.data.length == 0) {
                    await Product.deleteOne({ 'page_url': page_url })
                    return
                }
                let wc_custom = new WC_CUSTOM(res.data[0])
                let wc_id = res.data[0].id
                await Product.updateOne({ 'page_url': page_url }, {
                    $set: {
                        'woocommerce_id': wc_id,
                        'wc_custom': wc_custom
                    }
                }).catch((err) => {
                    logger.error("final check mongoDB update error " + err)
                })
            }).catch((err) => {
                logger.error('unprecessed product error : ' + err)
            })
        }
        await Product.find({ woocommerce_id: "" }).then((res) => {
            if (res.length == 0) {
                logger.info("에러없이 모두 처리 되었습니다.");
            } else {
                for (let i of res) {
                    logger.error("우커머스 id update 2차 시도 실패 메시지 page_url : " + i.page_url);
                }

            }
        })
    }, ExecTime);  //1시간 후 실행
}


// WC에서 Response 되어 sqs로 보내진 메시지들을 여기서 받음
const sqsAppForMongoDB = Consumer.create({
    queueUrl: QueueUrlForMongo,
    waitTimeSeconds: 10,
    pollingWaitTimeMs: 1000,
    batchSize: 10,
    handleMessageBatch: async (messages) => {
        return CreateToMongo(messages)
    },
    sqs: sqsClient
});


sqsAppForMongoDB.on('error', (err) => {
    logger.error(`sqsAppForMongoDB message recieve error : [${err.message}]`)
});

sqsAppForMongoDB.on('processing_error', (err) => {
    logger.error(`sqsAppForMongoDB message processing error : [${err.message}]`)
});

// 가공후 mongoDB에 woocommerce_id & wc_custom 등 update 하는 함수
let CreateToMongo = async function (sqsToMongoMessages: any[]) {
    let bulk_update_mongo = []
    for (let messages of sqsToMongoMessages) {
        let parsed_msg = JSON.parse(messages.Body)
        let woocommerce_id = parsed_msg.id;
        if (parsed_msg.lastModified == -1) {
            let bulk_delete =
            {
                deleteOne: {
                    "filter": { "woocommerce_id": woocommerce_id }
                }
            }
            bulk_update_mongo.push(bulk_delete)
            continue
        }

        let wc_url = parsed_msg.meta_data.find(item => item.key == 'mongo_page_url').value;
        if (!wc_url) {
            logger.error(`meta_data undefined : ${JSON.stringify(parsed_msg)}`)
            last_msg_chk -= 1 //에러난 메시지 갯수는 제외
            continue
        }
        let wc_custom = new WC_CUSTOM(parsed_msg)
        let bulk_setting =
        {
            updateOne:
            {
                "filter": { 'page_url': wc_url },
                "update": {
                    $set: {
                        'woocommerce_id': woocommerce_id,
                        'wc_custom': wc_custom
                    }
                }
            }
        }


        bulk_update_mongo.push(bulk_setting)
    }
    return BulkSendToMongo(bulk_update_mongo)
}
let mongo_msg_count = 0 //몽고db에 처리된 메시지 갯수
const BulkSendToMongo = function (bulk_update_mongo) {
    return Product.bulkWrite(bulk_update_mongo)
        .then(async (res) => {
            mongo_msg_count += res.modifiedCount
            mongo_msg_count += res.deletedCount
            if (mongo_msg_count === last_msg_chk) {
                mongo_msg_count = 0
                last_msg_chk = 0
                logger.info("All messages are processed")
                hook_flag = await AcitvateHook()
            }
        })
        .catch((err) => {
            logger.error(`mongoDB bulkwrite error : [${err}]`)
        })
}


sqsAppForWc.start()
sqsAppForMongoDB.start()



