import { Consumer } from 'sqs-consumer';
import config from '../src/config';
import AWS from 'aws-sdk'
import frisby from 'frisby'
import { jest_test_msg } from '../src/models/jest'
import { WC_DATA } from '../src/models/wc_data'
const QueueUrl = config.aws.sqs_to_wc_url;

AWS.config.update({
    region: config.aws.aws_region,
    accessKeyId: config.aws.access_key_id,
    secretAccessKey: config.aws.secret_access_key
});
const sqsClient = new AWS.SQS();

const { sendBatchedMessages } = require("sqs-bulk-loader")(sqsClient);


const woocommerce_ck = config.woocommerce.consumerKey;
const woocommerce_cs = config.woocommerce.consumerSecret;
/**
 * test
 */

//  test.skip -> 해당 테스트는 스킵할 수 있음
//  test.only -> 해당 테스트만 진행

// 예상한 갯수보다 받은 메시지가 적은 경우 jest.setTimeout으로 50초 안에 if문에 걸리지 않는 경우 타임아웃으로 에러처리
jest.setTimeout(3000 * 1000)  /*setimeout 안에 모든 테스트가 완료되어야 함*/
const test_msg_10 = 10

test.only(`${test_msg_10}개 전송 확인`, async (done) => {
    console.log(`${test_msg_10}개 전송 시작`)
    let send_messages = [];
    for (let i = 1; i <= test_msg_10; i++) {
        let msg = new jest_test_msg(i)
        send_messages.push(msg)
    }
    sendBatchedMessages(QueueUrl, send_messages)
        .then((response) => {
            console.log(response)
            expect(send_messages.length).toBe(test_msg_10)
            done()
        });
})

let send_wc = {
    create: []
    // update: []
};

function speedTest() {
    return new Promise<void>((resolve) => {
        for (let i = 0; i < 100; i++) {
            send_wc['create'].push(
                { name: `test${i}` }
            )
        }
        resolve()
    })
}

let sqs_msg_url_1 = [];
// <100개 테스트> 보낸 갯수와 받은 갯수가 일치하는지 확인
test.skip('10개 수신 확인', async (done) => {
    console.log("10개 수신 확인 시작")
    const sqsApp = Consumer.create({
        queueUrl: QueueUrl,
        waitTimeSeconds: 0,
        pollingWaitTimeMs: 3000,
        batchSize: 10,
        handleMessageBatch: async (messages) => {
            for (let msg of messages) {
                sqs_msg_url_1.push(msg)
            }
            if (sqs_msg_url_1.length >= test_msg_10) {                          //들어온 갯수가 예상한 갯수에 도달하면 메시지가 더 들어오나 7초동안 대기 
                testOverRecieve(sqs_msg_url_1, test_msg_10).then(_ => {           //만약 메시지가 예상한 갯수보다 더 들어오면 fail
                    console.log("예상메시지 갯수 테스트 끝")                                             //예상한 갯수보다 덜 들어오면 timeout으로 fail
                    sqsApp.stop()
                    done();
                }
                );
            }
        },
        sqs: new AWS.SQS()
    });
    sqsApp.start();
})

// 예상한 갯수보다 적으면 timeout으로 fail, 받은 메시지가 보낸 갯수보다 많은 경우도 fail시키는 함수
function testOverRecieve(received, expected) {
    console.log("메시지 초과수신확인 시작")
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            console.log("메시지 초과수신확인 끝")
            expect(sqs_msg_url_1.length).toEqual(expected);
            resolve();
        }, 2000);
    })
}

// <2번째 테스트> 중복 없으면 pass 있으면 fail

test('10개의 데이터 중 중복 확인', (done) => {
    console.log("10개 데이터 중복확인 시작")
    let duplicate_count = 0
    let duplicate_chk = false
    for (let i = 0; i < sqs_msg_url_1.length; i++) {
        for (let val in sqs_msg_url_1) {
            if (sqs_msg_url_1[i] == sqs_msg_url_1[val]) {
                duplicate_count++
            }
        }
        if (duplicate_count !== 1) {
            duplicate_chk = true
            break
        }
        duplicate_count = 0
    }
    expect(duplicate_chk).toBe(false)
    done()
});

let temp_update = [];

test('100개 우커머스에 잘 생성되었는지', async () => {
    console.log("우커머스 전송 시작")
    await speedTest()
    return frisby
        .timeout(800 * 1000)
        .post(`https://test1.readybaby.net/wp-json/wc/v3/products/batch?consumer_key=${woocommerce_ck}&consumer_secret=${woocommerce_cs}`, send_wc)
        .expect("status", 200)
        .then((res) => {
            let created_at_wc = res._json.create.length
            console.log(res._json.create.length)
            expect(created_at_wc).toBe(test_msg_10)
        })

})

// test('10개 우커머스에 업데이트 생성되었는지', async () => {
//     console.log("우커머스 업데이트 시작")
//     return frisby
//         .timeout(800 * 1000)
//         .post(`https://wordpress-573449-1852987.cloudwaysapps.com/wp-json/wc/v3/products/batch?consumer_key=${woocommerce_ck}&consumer_secret=${woocommerce_cs}`, data_update)
//         .then((res) => {
//             let created_at_wc = res._json.create.length
//             console.log(res._json.create.id)
//             expect(created_at_wc).toBe(test_msg_10)
//         })
//         .expect("status", 200)
// })
// ------------------------------------------------------------------------
// 이 밑에서부터는 대량 메시지(1000,2500) 테스트 로직
const test_msg_1000 = 1000

test.skip("1000개 보내졌는지", async (done) => {
    let send_messages = [];
    for (let i = 1; i <= test_msg_1000; i++) {
        let msg = new jest_test_msg(i)
        send_messages.push(msg)
    }
    sendBatchedMessages(QueueUrl, send_messages)
        .then((response) => {
            console.log(response)
            expect(send_messages.length).toBe(1000)
            done()
        });
})

let sqs_msg_url_2 = [];
// <1번째 테스트> 보낸 갯수와 받은 갯수가 일치하는지 확인
test.skip('1000개 받았는지 확인', async (done) => {
    console.log("1000개 테스트 시작")
    const sqsApp = Consumer.create({
        queueUrl: QueueUrl,
        waitTimeSeconds: 0,
        pollingWaitTimeMs: 3000,
        batchSize: 10,
        handleMessage: async (messages) => {
            let value = JSON.parse(messages.Body)
            console.log(value.page_url)
            sqs_msg_url_2.push(value.page_url)
            console.log(sqs_msg_url_2.length)
            if (sqs_msg_url_2.length >= test_msg_1000) {
                testOverRecieve(sqs_msg_url_2, test_msg_1000).then(_ => {
                    console.log("message confirmed")
                    sqsApp.stop()
                    done();
                }
                );
            }
        },
        sqs: new AWS.SQS()
    });
    sqsApp.start();
})

test.skip('1000개의 데이터 중 중복 확인', (done) => {
    let duplicate_count = 0
    let duplicate_chk = false
    for (let i = 0; i < sqs_msg_url_2.length; i++) {
        for (let val in sqs_msg_url_2) {
            if (sqs_msg_url_2[i] == sqs_msg_url_2[val]) {
                duplicate_count++
            }
        }
        if (duplicate_count !== 1) {
            duplicate_chk = true
            break
        }
        duplicate_count = 0
    }
    expect(duplicate_chk).toBe(false)
    done()
});
// ------------------------------------------------------------------------

const test_msg_2500 = 2500

test.skip("2500개 보내졌는지", async (done) => {
    let send_messages = [];
    for (let i = 1; i <= test_msg_2500; i++) {
        let msg = new jest_test_msg(i)
        send_messages.push(msg)
    }
    sendBatchedMessages(QueueUrl, send_messages)
        .then((response) => {
            console.log(response)
            expect(send_messages.length).toBe(2500)
            done()
        });
})



let sqs_msg_url_3 = [];

test.skip('2500개 받았는지 확인', async (done) => {
    console.log("2500개 테스트 시작")
    const sqsApp = Consumer.create({
        queueUrl: QueueUrl,
        waitTimeSeconds: 0,
        pollingWaitTimeMs: 3000,
        batchSize: 10,
        handleMessage: async (messages) => {
            let value = JSON.parse(messages.Body)
            console.log(value)
            sqs_msg_url_3.push(value.page_url)
            console.log(sqs_msg_url_3.length)
            if (sqs_msg_url_3.length >= test_msg_2500) {
                testOverRecieve(sqs_msg_url_3, test_msg_2500).then(_ => {
                    console.log("message confirmed")
                    sqsApp.stop()
                    done();
                }
                );
            }
        },
        sqs: new AWS.SQS()
    });
    sqsApp.start();
})


test.skip('2500개의 데이터 중 중복 확인', (done) => {
    let duplicate_count = 0
    let duplicate_chk = false
    for (let i = 0; i < sqs_msg_url_3.length; i++) {
        for (let val in sqs_msg_url_3) {
            if (sqs_msg_url_3[i] == sqs_msg_url_3[val]) {
                duplicate_count++
            }
        }
        if (duplicate_count !== 1) {
            duplicate_chk = true
            break
        }
        duplicate_count = 0
    }
    expect(duplicate_chk).toBe(false)
    done()
});
