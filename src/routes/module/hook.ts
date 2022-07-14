import config from '../../config';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import logger from '../../logger';

const WooCommerce = new WooCommerceRestApi({
    url: config.woocommerce.url,
    consumerKey: config.woocommerce.consumerKey,
    consumerSecret: config.woocommerce.consumerSecret,
    version: "wc/v3"
});

const create_hook_id = 24   //우커머스 hook id
const update_hook_id = 21


//우커머스 훅 일시정지
const PauseHook = async function () {
    const pause_create = {
        status: "paused"
    }
    const pause_update = {
        status: "paused"
    }
    await WooCommerce.put(`webhooks/${create_hook_id}`, pause_create)
        .then((response) => {
            logger.info("woocommerce create webhook paused")
        })
        .catch((error) => {
            logger.error(`woocommerce create webhook paused error : [${error.response.data}]`)
        });
    return await WooCommerce.put(`webhooks/${update_hook_id}`, pause_update)
        .then((response) => {
            logger.info("woocommerce update webhook paused")
            return false
        })
        .catch((error) => {
            logger.error(`woocommerce update webhook paused error : [${error.response.data}]`)
        });

}
//우커머스 훅 활성화
const AcitvateHook = async function () {
    const activate_create = {
        status: "active"
    }
    const activate_update = {
        status: "active"
    }
    await WooCommerce.put(`webhooks/${create_hook_id}`, activate_create)
        .then((response) => {
            logger.info("woocommerce create webhook activated")
        })
        .catch((error) => {
            logger.error(`woocommerce create webhook activate error : [${error.response.data}]`)
        });
    return await WooCommerce.put(`webhooks/${update_hook_id}`, activate_update)
        .then((response) => {
            logger.info("woocommerce update webhook activated")
            return true
        })
        .catch((error) => {
            logger.error(`woocommerce update webhook activate error : [${error.response.data}]`)
        });

}

module.exports = { PauseHook, AcitvateHook }