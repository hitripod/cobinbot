'use strict';

const RestClient = require('../lib/rest-client');
const fs = require('fs');
const Affair = require('./affair');
const Debug = require('../lib/debug');
const config = require('../config');

const restClient = new RestClient('api.cobinhood.com', 443);
class TokenRefresher extends Affair {

    saveToken() {
        config.token = this.token;
        let configFile = "'use strict';\n\n";
        configFile += 'module.exports = {\n';
        for (let key in config) {
            configFile += `\t${key}: '${config[key]}',\n`;
        }
        configFile += '};\n';
        fs.writeFile('config.js', configFile, (err) => {
            if (err) {
                Debug.warning([this.TAG, 'Can not save config file.']);
            }
        });
    }
    constructor() {
        super();
        this.TAG = 'Token Refresher';
        this.token = config.token;
        setInterval(() => {
            restClient.post('/v1/account/refresh_token', 
                { 
                    authorization: this.token,
                    nonce: new Date().valueOf()
                }, 
                {}
            ).then((result) => {
                if (!result.success) {
                    Debug.warning([this.TAG, 'Can not get refresh token.']);
                    return;
                }
                Debug.success([this.TAG, 'Successfully refresh token.']);
                //console.log(result.result.account.token);
                this.token = result.result.account.token;
                this.saveToken();
            }, super.handleErr);
        }, TokenRefresher.refreshPeriod);
    }
}
TokenRefresher.refreshPeriod = 10 * 60 * 1000;
module.exports = TokenRefresher;

//const tr = new TokenRefresher();
//tr.saveToken();