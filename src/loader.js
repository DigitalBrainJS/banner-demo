import sandbox from './lib/sandbox';
import audio from './lib/audio';
import {randomStr, generateElementId, documentReady} from './lib/utils';
import JSONP from './lib/jsonp';
import "babel-polyfill";

((win, doc) => {

    const id = generateElementId();

    doc.write(`<div class="container" id=${id}></div>`);

    documentReady().then(() => {
        const container = doc.getElementById(id);
        if (!container) {
            throw Error(`Cannot find container [${id}] in DOM`)
        }

        const {parentNode} = container;

        parentNode.innerHTML = '<div class="spinner lds-dual-ring"></div>';

        JSONP.request('/banner.php', {
            sandbox: sandbox.isSandbox(true), //treat uncertain result for cross-origin case as sandboxed mode
            audio: audio.isSupported()
        }).then(response => {
            console.log('recv jsop data', response);

            const {html, scripts, data} = response;

            if (html) {
                if (typeof html != 'string') {
                    throw TypeError('Wrong type of JSONP banner prop');
                }
                container.innerHTML = html;
            }

            if (scripts) {
                if (Object.prototype.toString.call(scripts) !== '[object Object]') {
                    throw new TypeError('scripts should be an object');
                }

                const promises = Object.keys(scripts).map(id => {
                    const code = scripts[id];

                    const originalExports = {},
                        module = {
                            exports: originalExports,
                            imports: {JSONP},
                            data,
                            container
                        };

                    if (typeof code != 'string') {
                        throw TypeError(`Script code of [${id}] should be a string`);
                    }

                    try {
                        let fn = new Function(['module', 'container', 'data'], `return function ${id}(){${code}}`)(
                            module,
                            container,
                            data
                        );

                        const fnResult = fn.call(container),
                            {exports} = module;

                        return fnResult === undefined &&
                        (exports !== originalExports || Object.keys(exports).length) ?
                            exports : fnResult;

                    } catch (e) {
                        throw new Error(`Script [${id}] running failed with message [${e.message}]`);
                    }

                }).filter(result => result && typeof result.then === 'function');

                const {length} = promises;

                if (length === 1) {
                    return promises[0];
                } else if (length > 1) {
                    return Promise.all(promises);
                }
            }


        }).then(() => {
            parentNode.innerHTML = "";
            parentNode.appendChild(container);
        }).catch((error) => {
            console.error(error, error.message);
            parentNode.innerHTML = `<div class="error">Error (${error.message}) Try to turn off your AdBlock.</div>`;
        });
    })
})(window, document);

