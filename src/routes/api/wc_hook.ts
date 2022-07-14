import { Router, Request, Response, NextFunction, response, application, request } from 'express';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import config from '../../config';
import crypto from 'crypto';
import Logger from '../../logger';
import bodyParser from 'body-parser';
import { WC_CUSTOM } from '../../models/wc_data'
import { nextTick } from 'process';


const Product = require('../../models/product')
const moment = require('moment')

const express = require('express');
const app = express();
const router = express.Router();

// woocommerce setting
const WooCommerce = new WooCommerceRestApi({
  url: config.woocommerce.url,
  consumerKey: config.woocommerce.consumerKey,
  consumerSecret: config.woocommerce.consumerSecret,
  version: "wc/v3"
});


//CREATE HOOK

router.post('/hook/create', async (req, res: Response, next: NextFunction) => {
  Logger.info(`<GET> woocommerce/hook/create`);
  try {
    const secret = config.collection.woocommerceKey;
    const signature = req.header("x-wc-webhook-signature");
    const hash = crypto.createHmac('SHA256', secret).update(req.rawBody).digest('base64');
    if (signature === hash) {
      console.log('match');
      const body = req.body
      const wc_url = body.meta_data.find(item => item.key == 'mongo_page_url').value;
      const woocommerce_id = body.id;
      let wc_custom = new WC_CUSTOM(body)
      await Product.updateOne({ 'page_url': wc_url }, {
        $set: {
          'woocommerce_id': woocommerce_id,
          'wc_custom': wc_custom
        },
      }, (err: any, result: any) => {
        if (err || result.ok === 0) {
          Logger.info(`create hook error : [${err} or ${result.ok}]`)
          return res.status(500).json({ 'error': err, 'result': result })
        }
      });
      res.status(200).end();
    } else {
      console.log('unmatch')
      Logger.error('create crypto hash unmatched');
      return res.status(401).end();
    }
  } catch (error) {
    Logger.error('woocommerce create hook error')
    next(error);
    return;
  }
});

//UPDATE HOOK

router.post('/hook/update', async (req, res: Response, next: NextFunction) => {
  Logger.info(`<GET> woocommerce/hook/update`);
  try {
    const secret = config.collection.woocommerceKey;
    const signature = req.header("x-wc-webhook-signature");
    const hash = crypto.createHmac('SHA256', secret).update(req.rawBody).digest('base64');
    if (signature === hash) {
      console.log('match');
      const body = req.body
      const wc_url = body.meta_data.find(item => item.key == 'mongo_page_url').value;
      const woocommerce_id = body.id
      let wc_custom = new WC_CUSTOM(body)
      await Product.updateOne({ 'page_url': wc_url }, {
        $set: {
          'woocommerce_id': woocommerce_id,
          'wc_custom': wc_custom
        }
      }, (err, result) => {
        if (err || result.ok === 0) {
          return res.status(500).json({ 'error': err, 'result': result })
        }
      });
      res.status(200).end();
    } else {
      console.log('unmatch');
      Logger.error('update crypto hash unmatched');
      return res.status(401).end();
    }
  } catch (error) {
    Logger.error('wc-mongodb update hook error')
    next(error);
    return;
  }
});


//DELETE HOOK

router.post('/hook/delete', async (req, res: Response, next: NextFunction) => {
  Logger.info(`<GET> woocommerce/hook/delete`)
  try {
    const secret = config.collection.woocommerceKey;
    const signature = req.header("x-wc-webhook-signature");
    const hash = crypto.createHmac('SHA256', secret).update(req.rawBody).digest('base64');
    if (signature === hash) {
      console.log('match');
      const body = req.body;
      await Product.deleteOne({ 'woocommerce_id': `${body.id}` })
        .then(function () {
          Logger.info('delete hook done'); //Success
        })
        .catch(function (error) {
          Logger.error('delete hook - delete document error : ' + error);; // Failure
        });
      res.status(200).end();
    } else {
      console.log('unmatch')
      Logger.error('delete crypto hash unmatched');
      return res.status(401).end();
    }
  } catch (error) {
    next(error);
    return;
  }

})
//RETRIEVE HOOK

router.post('/hook/retrieve', async (req, res) => {
  Logger.info(`<GET> woocommerce/hook/retrieve`)
  try {
    const secret = config.collection.woocommerceKey;
    const signature = req.header("x-wc-webhook-signature");
    const hash = crypto.createHmac('SHA256', secret).update(req.rawBody).digest('base64');
    const body = req.body;
    if (signature == hash) {
      console.log('match');
      const wooCommerceretrieveCustomField = async () => {
        await WooCommerce.get(`products/${body.id}`).then((res) => {
          let body = res.data
          let woocommerce_id = body.id;
          let temp: any = {}
          body.meta_data.forEach(element => {
            temp[element.key] = element.value
          });
          temp.mongo_created_at = moment(temp.mongo_created_at)
          temp.mongo_created_at_gmt = moment(temp.mongo_created_at_gmt)
          temp.mongo_updated_at = moment(temp.mongo_updated_at)
          temp.mongo_updated_at_gmt = moment(temp.mongo_updated_at_gmt)

          if (temp.mongo_lastModified == "1") {
            temp.mongo_lastModified = true
          } else {
            temp.mongo_lastModified = false
          }
          let wc_custom = new WC_CUSTOM(body) //wc_custom 객체 생성
          Product.create(
            {
              page_url: temp.mongo_page_url,
              woocommerce_id: woocommerce_id,
              static: {
                checklist_name: temp.mongo_checklist_name,
                purpose: temp.mongo_purpose,
                subpurpose: temp.mongo_subpurpose,
                period: temp.mongo_period,
                locale: temp.mongo_locale,
                deeplink_url: temp.mongo_deeplink_url,
                site_name: temp.mongo_site_name,
                category0: temp.mongo_category0,
                category1: temp.mongo_category1,
                category2: temp.mongo_category2,
                category3: temp.mongo_category3,
                category4: temp.mongo_category4,
                search_input: temp.mongo_search_input,
                thumbnail_default: temp.mongo_thumbnail_default,
                product_brand_name: temp.mongo_product_brand_name,
                product_title: temp.mongo_product_title
              },
              dynamic: {
                created_at: temp.mongo_created_at,
                created_at_gmt: temp.mongo_created_at_gmt,
                product_origin_price: Number(temp.mongo_product_origin_price),
                product_price: Number(temp.mongo_product_price),
                number_of_reviewers: Number(temp.mongo_number_of_reviewers),
                review_average_rating: Number(temp.mongo_review_average_rating),
                product_delivery_options: temp.mongo_product_delivery_options,
                product_benefit_options: temp.mongo_product_benefit_options ,
                discount_rate: Number(temp.mongo_discount_rate),
                product_rank_origin: Number(temp.mongo_product_rank_origin),
                sort_type: temp.mongo_sort_type
              },
              rank_point: Number(temp.mongo_rank_point),
              click_count: Number(temp.mongo_click_count),
              wish_count: Number(temp.mongo_wish_count),
              lastModified: temp.mongo_lastModified,
              created_at: temp.mongo_created_at,
              created_at_gmt: temp.mongo_created_at_gmt,
              updated_at: temp.mongo_updated_at,
              updated_at_gmt: temp.mongo_updated_at_gmt,
              wc_custom: wc_custom
            },
            (err, result) => {
              if (err || result.ok === 0) {
                return res.status(500).json({ 'error': err, 'result': result })
              }
            })
        })
      }
      await wooCommerceretrieveCustomField();
    } else {
      console.log('unmatch');
      Logger.error("retrieve crypto hash unmatched")
      return res.status(401).end();
    }
    res.status(200).end();
  } catch (error) {
    Logger.error("wc-mongodb retrieve hook error : " + error);
    return;
  }
})



module.exports = router;