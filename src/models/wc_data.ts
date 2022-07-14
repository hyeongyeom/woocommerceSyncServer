const moment = require('moment')

export class WC_DATA {
    id: string;
    name: string;
    // images: any[];
    regular_price: number;
    sale_price: number;
    meta_data: any[];
    constructor(message, origin_price: number, sale_price: number, categories: any[]) {
        this.id = message.woocommerce_id;
        this.name = message.static.product_title;
        // this.images = [
        //     {
        //         src: message.static.thumbnail_default   // 이미지가 기본으로 업로드하면 미디어에도 저장되어 용량 많이 차지 -> meta_data에 thumnail_default 이미지 사용
        //     }
        // ];
        this.regular_price = origin_price;
        this.sale_price = sale_price;
        this.meta_data = [
            {
                key: "mongo_page_url",
                value: message.page_url
            },
            // static data
            {
                key: "mongo_locale",
                value: message.static.locale
            },
            {
                key: "mongo_deeplink_url",
                value: message.static.deeplink_url
            },
            {
                key: "mongo_site_name",
                value: message.static.site_name
            },
            {
                key: "mongo_checklist_name",
                value: message.static.checklist_name
            },
            {
                key: "mongo_purpose",
                value: message.static.purpose
            },
            {
                key: "mongo_subpurpose",
                value: message.static.subpurpose
            },
            {
                key: "mongo_period",
                value: message.static.period
            },
            {
                key: "mongo_category0",
                value: categories[0]
            },
            {
                key: "mongo_category1",
                value: categories[1]
            },
            {
                key: "mongo_category2",
                value: categories[2]
            },
            {
                key: "mongo_category3",
                value: categories[3]
            },
            {
                key: "mongo_category4",
                value: categories[4]
            },
            {
                key: "mongo_search_input",
                value: message.static.search_input
            },
            {
                key: "mongo_thumbnail_default",
                value: message.static.thumbnail_default
            },
            {
                key: "mongo_product_brand_name",
                value: message.static.product_brand_name
            },
            {
                key: "mongo_product_title",
                value: message.static.product_title
            },
            //dynamic data
            {
                key: "mongo_created_at",
                value: message.dynamic.created_at
            },
            {
                key: "mongo_created_at_gmt",
                value: message.dynamic.created_at_gmt
            },
            {
                key: "mongo_product_origin_price",
                value: message.dynamic.product_origin_price
            },
            {
                key: "mongo_product_price",
                value: message.dynamic.product_price
            },
            {
                key: "mongo_number_of_reviewers",
                value: message.dynamic.number_of_reviewers
            },
            {
                key: "mongo_review_average_rating",
                value: message.dynamic.review_average_rating
            },
            {
                key: "mongo_product_delivery_options",
                value: message.dynamic.product_delivery_options
            },
            {
                key: "mongo_product_benefit_options",
                value: message.dynamic.product_benefit_options
            },
            {
                key: "mongo_discount_rate",
                value: message.dynamic.discount_rate
            },
            {
                key: "mongo_product_rank_origin",
                value: message.dynamic.product_rank_origin
            },
            {
                key: "mongo_sort_type",
                value: message.dynamic.sort_type
            },
            // dynamic data end
            {
                key: "mongo_rank_point",
                value: message.rank_point
            },
            {
                key: "mongo_click_count",
                value: message.click_count
            },
            {
                key: "mongo_wish_count",
                value: message.wish_count
            },
            {
                key: "mongo_lastModified",
                value: message.lastModified
            },
            {
                key: "mongo_updated_at",
                value: message.updated_at
            },
            {
                key: "mongo_updated_at_gmt",
                value: message.updated_at_gmt
            }
        ]
    }
}

export class WC_CUSTOM {
    title: string;
    woocommerce_product_url: string;
    regular_price: number;
    sale_price: number;
    date_created: any;
    date_created_gmt: any;
    date_modified: any;
    date_modified_gmt: any;
    type: string;
    description: string;
    short_description: string;
    sku: string;
    status: string;
    brand: string;
    categories: string;
    tag: string;
    constructor(body) {
        this.title = body.name;
        this.woocommerce_product_url = body.permalink;
        this.regular_price = Number(body.regular_price);
        this.sale_price = Number(body.sale_price);
        /*몽고디비에서 자동으로 UTC 시간으로 맞추기 때문에 +9 hours 해줘야 의도한 시간과 맞음*/
        this.date_created = new Date(moment(body.date_created).add(9, 'hours'));
        this.date_created_gmt = new Date(moment(body.date_created_gmt).add(9, 'hours'));
        this.date_modified = new Date(moment(body.date_modified).add(9, 'hours'));
        this.date_modified_gmt = new Date(moment(body.date_modified_gmt).add(9, 'hours'));
        this.type = body.type;
        this.description = body.description.replace(/<(\/?)p>/gi, "");
        this.short_description = body.short_description.replace(/<(\/?)p>/gi, "");
        this.sku = body.sku;
        this.status = body.status;
        this.brand = body.brands
        this.categories = body.categories;
        this.tag = body.tags
    }
}

