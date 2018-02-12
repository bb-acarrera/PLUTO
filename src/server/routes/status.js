const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');


class StatusRouter extends BaseRouter {
    constructor(config) {
        super(config);
        this.config = config || {};
    }

    get(req, res, next) {
        let page = parseInt(req.query.page, 10) - 1;
        let size = parseInt(req.query.size, 10);

        if(isNaN(page)) {
            page = 0;
        }

        if(isNaN(size)) {
            size = 10;
        }
        this.config.data.getErrors(size, page*size).then( (result)=> {
            res.json( {
                data: result.result.rows.map( ( val, id ) => {
                    return {
                        type: "status",
                        id: id,
                        attributes: val
                    };
                } ),
                meta: { totalPages: Math.ceil(Number(result.count)/size) }
            } );
            }
        );
    }


}

module.exports = StatusRouter;
