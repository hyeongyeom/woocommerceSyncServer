import dotenv from "dotenv";

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (!envFound) {
  throw new Error("Couldn't find .env file");
}
let configData: any;
if(process.env.NODE_ENV=='development'){   // staging environment도 됨
  configData = {
    apikey: process.env.API_CONFIG_KEY,
    port: parseInt(process.env.PORT, 10),
    env: process.env.NODE_ENV,
    logs: {
      level: process.env.LOG_LEVEL,
    },
    collection: {
      url: process.env.DEV_ATLAS_URL,
      appDataDB: process.env.DEV_ATLAS_DATABASE,
      collectionProduct: process.env.DEV_ATLAS_COLLECTION,
      woocommerceKey: process.env.WOOCOMMERCE_DEV_HOOK_KEY
    },
    agenda: {
      dbCollection: process.env.MONGO_ATLAS_COLLECTION_TEST,
    },
    api: {
      prefix: "/api",
    },
    woocommerce: {
      url: process.env.WOOCOMMERCE_DEV_URL,
      consumerKey: process.env.WOOCOMMERCE_DEV_CK,
      consumerSecret: process.env.WOOCOMMERCE_DEV_CS
    },
    aws: {
      access_key_id:process.env.AWS_DEV_ACCESS_KEY_ID,
      secret_access_key:process.env.AWS_DEV_SECRET_ACCESS_KEY,
      sqs_to_wc_url:process.env.AWS_DEV_SQS_TO_WC_URL,
      sqs_from_wc_url:process.env.AWS_DEV_SQS_FROM_WC_URL,
      aws_region:process.env.AWS_DEV_REGION,
      aws_elasticache_redis:process.env.AWS_DEV_ELASTICACHE_REDIS_PRIMARY_ENDPOINT
    },
    dokan: {
      url:process.env.DOKAN_DEV_URL,
      username:process.env.DOKAN_DEV_USERNAME,
      password:process.env.DOKAN_DEV_PASSWORD
    }
  };
} else if(process.env.NODE_ENV='staging') {
  configData = {
    apikey: process.env.API_CONFIG_KEY,
    port: parseInt(process.env.PORT, 10),
    env: process.env.NODE_ENV,
    logs: {
      level: process.env.LOG_LEVEL,
    },
    collection: {
      url: process.env.STAGING_ATLAS_URL,
      appDataDB: process.env.STAGING_ATLAS_DATABASE,
      collectionProduct: process.env.STAGING_ATLAS_COLLECTION,
      woocommerceKey: process.env.WOOCOMMERCE_STAGING_HOOK_KEY
    },
    agenda: {
      dbCollection: process.env.MONGO_ATLAS_COLLECTION_TEST,
    },
    api: {
      prefix: "/api",
    },
    woocommerce: {
      url: process.env.WOOCOMMERCE_STAGING_URL,
      consumerKey: process.env.WOOCOMMERCE_STAGING_CK,
      consumerSecret: process.env.WOOCOMMERCE_STAGING_CS
    },
    aws: {
      access_key_id:process.env.AWS_STAGING_ACCESS_KEY_ID,
      secret_access_key:process.env.AWS_STAGING_SECRET_ACCESS_KEY,
      sqs_to_wc_url:process.env.AWS_STAGING_SQS_TO_WC_URL,
      sqs_from_wc_url:process.env.AWS_STAGING_SQS_FROM_WC_URL,
      aws_region:process.env.AWS_STAGING_REGION,
      aws_elasticache_redis:process.env.AWS_STAGING_ELASTICACHE_REDIS_PRIMARY_ENDPOINT
    },
    dokan: {
      url:process.env.DOKAN_STAGING_URL,
      username:process.env.DOKAN_STAGING_USERNAME,
      password:process.env.DOKAN_STAGING_PASSWORD
    }
  }
}
else if(process.env.NODE_ENV=='production'){
  configData = {
    apikey: process.env.API_CONFIG_KEY,
    port: parseInt(process.env.PORT, 10),
    env: process.env.NODE_ENV,
    logs: {
      level: process.env.LOG_LEVEL,
    },
    collection: {
      url: process.env.PRODUCT_ATLAS_URL,
      appDataDB: process.env.PRODUCT_ATLAS_DATABASE,
      collectionProduct: process.env.PRODUCT_ATLAS_COLLECTION,
      woocommerceKey: process.env.WOOCOMMERCE_PRODUCT_HOOK_KEY
    },
    api: {
      prefix: "/api",
    },
    woocommerce: {
      url: process.env.WOOCOMMERCE_PRODUCT_URL,
      consumerKey: process.env.WOOCOMMERCE_PRODUCT_CK,
      consumerSecret: process.env.WOOCOMMERCE_PRODUCT_CS
    },
    aws: {
      access_key_id:process.env.AWS_ACCESS_KEY_ID,
      secret_access_key:process.env.AWS_SECRET_ACCESS_KEY,
      sqs_to_wc_url:process.env.AWS_PRODUCT_SQS_TO_WC_URL,
      sqs_from_wc_url:process.env.AWS_PRODUCT_SQS_FROM_WC_URL,
      region:process.env.AWS_PRODUCT_REGION,
      aws_elasticache_redis:process.env.AWS_PRODUCT_ELASTICACHE_REDIS_PRIMARY_ENDPOINT
    },
    dokan: {
      url:process.env.DOKAN_PRODUCT_URL,
      username:process.env.DOKAN_PRODUCT_USERNAME,
      password:process.env.DOKAN_PRODUCT_PASSWORD
    }
  };
}

export default configData;