import {randomStr} from "./utils";


const registerKey= 'r' + randomStr(),
    callbackRegister= window[registerKey]= {};

const {body}= document;

function request(src, params= {}, cache=false, timeout= 60000){
    return new Promise(function(resolve, reject){

        let cbKey='';

        do {
        } while ((cbKey = 'cb' + randomStr(3)) in callbackRegister);

        let called= false;

        function cleenup() {
            delete callbackRegister[cbKey];
            body.removeChild(script);
        }

        callbackRegister[cbKey]= (data)=>{
            called= true;
            cleenup();
            resolve(data);
        };

        params.callback= `${registerKey}.${cbKey}`;
        if(!cache){
            params._rnd= randomStr()
        }


        let queryString = params && Object.keys(params).map(param => {
            let rawValue = params[param];
            return `${param}=${encodeURIComponent(typeof rawValue == 'object' ? JSON.stringify(rawValue) : ('' + rawValue))}`;
        }).join('&');

        const script = document.createElement("script");
        script.async = true;
        script.type = "text/javascript";

        function handler(err){
            if(!called) {
                cleenup();
                reject(new Error('JSONP callback was not called'));
            }
        }

        script.onload= handler;

        script.onreadystatechange = function() {
            if (script.readyState == 'complete' || script.readyState == 'loaded') {
                script.onreadystatechange = null;
                setTimeout(handler, 0);
            }
        };

        script.onerror= ()=>{
            reject(new Error('internal'));
        };

        script.src = src + (queryString ? '?' + queryString : '');

        body.appendChild(script);

        setTimeout(()=>{
            reject(new Error('timeout'));
        }, timeout)
    })
}

export default {
    request
}