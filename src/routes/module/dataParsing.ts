import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import config from '../../config';
import mockData from './mock/mockdata.json';
const MongoClient = require('mongodb').MongoClient;

let client: any;
let collection: any;

const bulkDeleteData = {
  delete: []
};

const insertDataArr = {
  create: []
};


const WooCommerce = new WooCommerceRestApi({
  url: config.woocommerce.url,
  consumerKey: config.woocommerce.consumerKey,
  consumerSecret: config.woocommerce.consumerSecret,
  version: "wc/v3"
});


const attributeNameArr: string[] = ['category0', 'category1', 'category2', 'category3', 'category4', 'category5', 'search_input'];
const idArr: number[] = [];





const getWooCommerceAttributes = async () => {
  await WooCommerce.get('products/attributes')
    .then((response) => {
      console.log(response.data);
      for (const items of attributeNameArr) {
        for (let i = 0; i < response.data.length; i++) {
          if (response.data[i].name == items) idArr.push(response.data[i].id);
        }
      }
    })
    .catch((error) => {
      console.log(error.response.data);
    });
}

const mongoParserToWooCommerce = async (mongoProductArr: any[]) => {
  await getWooCommerceAttributes();
  console.log('test!');
  console.log(idArr);
  for (let i = 0, len = mongoProductArr.length; i < len; i++) {
    const data = {
      name: mongoProductArr[i].static.product_title,
      type: "",
      // status: "private",
      regular_price: mongoProductArr[i].dynamic.product_price,
      external_url: mongoProductArr[i].static.deeplink_url,
      images: [
        {
          src: mongoProductArr[i].static.thumbnail_default
        }
      ],
      attributes: [
        {
          id: idArr[0],
          name: attributeNameArr[0],
          visible: false,
          options: [mongoProductArr[i].static.category0]
        },
        {
          id: idArr[1],
          name: attributeNameArr[1],
          options: [mongoProductArr[i].static.category1]
        },
        {
          id: idArr[2],
          name: attributeNameArr[2],
          options: [mongoProductArr[i].static.category2]
        },
        {
          id: idArr[3],
          name: attributeNameArr[3],
          options: [mongoProductArr[i].static.category3]
        },
        {
          id: idArr[4],
          name: attributeNameArr[4],
          options: [mongoProductArr[i].static.category4]
        },
        {
          id: idArr[5],
          name: attributeNameArr[5],
          options: [mongoProductArr[i].static.category5]
        },
        {
          id: idArr[6],
          name: attributeNameArr[6],
          options: [mongoProductArr[i].static.search_input]
        },
      ],
      default_attributes: [
        {
          id: idArr[0],
          option: mongoProductArr[i].static.category0
        },
        {
          id: idArr[1],
          option: mongoProductArr[i].static.category1
        },
        {
          id: idArr[2],
          option: mongoProductArr[i].static.category2
        },
        {
          id: idArr[3],
          option: mongoProductArr[i].static.category3
        },
        {
          id: idArr[4],
          option: mongoProductArr[i].static.category4
        },
        {
          id: idArr[5],
          option: mongoProductArr[i].static.category5
        },
        {
          id: idArr[6],
          option: mongoProductArr[i].static.search_input
        },
      ],
      meta_data: [
        {
          "key": "product_url",
          "value": mongoProductArr[i].page_url
        },
        {
          "key": "static_field",
          "value": mongoProductArr[i].static
        },
        {
          "key": "dynamic_field",
          "value": mongoProductArr[i].dynamic
        }
      ]

    }
    insertDataArr.create.push(data);
  }
}



const wooCommerceDBUpdate = async (target: any, mongoData: any[]) => {
  try {
    client = await MongoClient.connect(target.url, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
    console.log(target.url);
    console.log(target.db);
    const db = await client.db(target.db);
    collection = await db.collection(target.collectionProduct);
    //const mongoData: any[] = await collection.find({}).limit(100).toArray();
    await mongoParserToWooCommerce(mongoData);
    await WooCommerce.post("products/batch", insertDataArr)
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        //console.log(error.response.data);
      });
    console.log(mongoData.length);
    console.log(mongoData[1]);
    client.close();
  } catch (err) {
    console.error('error on wooCommerceDBUpdate');
    console.error(err);
  }
}

const wooCommerceFindTest = async () => {
  try{
    await WooCommerce.get('products/14464').then((res)=> {
      console.log(res.data);
    })
  } catch (err) {
    console.error(err);
  }
}

// WooCommerce.post("products", data)
//   .then((response) => {
//     console.log(response.data);
//   })
//   .catch((error) => {
//     console.log(error.response.data);
//   });   


//기존 상품 데이터 제거
const wooCommerceDeleteProcess = async () => {
  // api 최대 100개가 제한
  const parameter = {
    per_page: 100,
    status: 'any'
  }
  await WooCommerce.get('products', parameter)
    .then((response) => {
      console.log(response.data.length);
      for (let i = 0, len = response.data.length; i < len; i++) {
        bulkDeleteData.delete.push(response.data[i].id);
      }
      console.log(bulkDeleteData.delete);
    })
    .catch((error) => {
      console.log(error.response.data);
    });
  //console.log(insertMockData.create.length);
  await WooCommerce.post("products/batch", bulkDeleteData)
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log(error.response.data);
    });
}

const wooCommerceTest = async () => {
  // api 최대 100개가 제한
  const parameter = {
    per_page: 100,
    status: 'any'
  }
  await WooCommerce.get('products/attributes', parameter)
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log(error.response.data);
    });
}

// wooCommerceDeleteProcess();
// // wooCommerceTest();
// wooCommerceDBUpdate(config.collection);
// wooCommerceFindTest();

const staticArrayAttribute = [
    'checklist_name',
    'purpose',
    'subpurpose',
    'period',
  ];


//시트데이터 (search result)를 mongodb 형태로 변환
const sheetDataToMongoForm = async (sheetData: any[]) => {
    const resultArr: any[] = [];
    const keyArr = Object.keys(sheetData[0]);
    const dynamicArr = keyArr.filter((item)=>
        item.split('.')[0] === 'dynamic'
    )
    const staticArr = keyArr.filter((item)=>
        item.split('.')[0] === 'static'
    )
    console.log(keyArr);
    
    console.log(staticArr);
    
    for(const item of sheetData){
        const resultObject: any = {
            _id : item._id,
            page_url : item.page_url,
            rank_point: item.rank_point,
            click_count: item.click_count,
            wish_count: item.wish_count,
            lastModified: item.lastModified
        };
        let staticObject :any = { };
        let dynamicObject :any = { };
        for(const tmp of staticArr) {
            staticObject[tmp.split('.')[1]]=item[tmp];
        }
        for(const tmp of dynamicArr) {
            dynamicObject[tmp.split('.')[1]]=item[tmp];
        }
        resultObject.static = staticObject;
        resultObject.dynamic = dynamicObject;
        resultObject.static.checklist_name = resultObject.static.checklist_name.split();
        resultObject.static.purpose = resultObject.static.purpose.split();
        resultObject.static.subpurpose = resultObject.static.subpurpose.split();
        resultObject.static.period = resultObject.static.period.split();
        resultArr.push(resultObject);
    }

    // console.log(resultArr[0])
    return resultArr;
}


export { sheetDataToMongoForm, wooCommerceDBUpdate }

