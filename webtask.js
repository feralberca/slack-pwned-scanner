// Slack will send a request for each message sent on any or a specific channel.
// If trigger word has been configured on Slack, only messages starting with
// that trigger word will be sent

var https = require('https');

var GENERIC_SUCCESS_MSG = 'Congrats!, your account was not pwned.';
var GENERIC_FAILURE_MSG = 'Sorry, there was an internal error.';

//Base HTTP Options
var pwnedSiteProps = {
    host: 'haveibeenpwned.com',
    port: '443',
    basePath: '/api/v2/breachedaccount/',
    method: 'GET',
    headers: { 'user-agent': 'node.js http'}
};

//Returns a new HTTP parameterization using base properties plus the user account
function HttpParameters(baseProps, account) {
    this.host = baseProps.host;
    this.port = baseProps.port;
    this.path = baseProps.basePath + account;
    this.method = baseProps.method;
    this.headers = baseProps.headers;
}

//Validates the user account against the 'user@domain' pattern  
function validAccount(account) {
    var email_pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
    return email_pattern.test(account);
}

//Handle actions based on responses, this object offers an interface for creating a pipeline of
//evaluations and actions
var responseHandler = {

    handlers: [],

    //Adds an action for a given condition
    chain: function(conditional, action) {
        var handler = {};
        handler.conditional = conditional;
        handler.action = action;
        this.handlers.push(handler);

        return this;
    },

    //Default action if any of the previous was false
    default: function(action) {
        return this.chain(function() {
            return true;
        },
        action);
    },

    //Initiates the processing pipeline for the given response
    handle: function(response, callback) {
        this.handlers.some(function(handler) {
            if (handler.conditional(response, callback)) {
                handler.action(response, callback);
                return true;
            }
        });
    }
};

//The API is not so restful, so we created a chain of handlers for executing a given action
//based on the response propertiers such as status code and content type. 
//Some errors are received in plain HTML with status OK
responseHandler.chain(function(res, done) {
        //Only activate the associated action if the status code is OK and the content type is JSON
        return res.statusCode == 200 &&
            res.headers['content-type'] &&
            res.headers['content-type'].includes('application/json');
    }, function(res, done) {
        var data = '';

        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            if (data.length > 0) {
                try {
                    var breaches = JSON.parse(data);
                    if (breaches.length > 0) {
                        message = 'Yikes!, found your account mentioned in the following beached or spammers sites: \n';
                        breaches.forEach(function(site) {
                            message += ' ' + site.Title + ' (' + site.Domain + ') \n';
                        });
                    }
                } catch (e) {
                    message = GENERIC_FAILURE_MSG;
                    console.log('Error while trying to parse response data:' + e);
                }
            }
            done(null, { text: message });
        });

        res.on('error', function(err) {
            done(null, { text: GENERIC_FAILURE_MSG });
            console.log('Error while trying to process API response:' + e);
        });
    }).chain(function(res, done) {
        //If status code is not_found, then the account wasn't found in the API database
        return res.statusCode == 404;
    }, function(res, done) {
        done(null, { text: GENERIC_SUCCESS_MSG });
    }).default(function(res, done) {
        //if none of previous is true, then we received an invalid answer from the API
        done(null, { text: GENERIC_FAILURE_MSG });
        console.log('Invalid API response. Got response status:' + res.statusCode +
                    ' with headers:' + JSON.stringify(res.headers));
    });

module.exports = function (context, done) {
    console.log('Incoming slack request', context.body);

    var account = context.body.text;
  
    if (account) {
        if (validAccount(account)) {
          https.request(new HttpParameters(pwnedSiteProps, account), function(res) {
              res.setEncoding('utf8');
              responseHandler.handle(res, done);
          }).end();
        } else {
          console.log('Received invalid account from slack:' + account);
          done(null, { text: 'Invalid account:"' + account + '" The account must follow a "user@domain" pattern.' });
        }
    } else {
        console.log('Invalid request, parameter "account" is missing');
        done(null, { text: 'You must provide an account!'});       
    }
};
