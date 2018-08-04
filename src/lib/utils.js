export let global = new Function('return this')();

export function documentReady() {

    const win = window;

    return new Promise(function (resolve) {

        const _resolve = () => {
            win.removeEventListener('DOMContentLoaded', _resolve, false);
            resolve(document.readyState);
        };

        if (document.readyState === 'complete') {
            _resolve();
        } else {
            win.addEventListener('DOMContentLoaded', _resolve, false);
        }
    })
}

export function randomStr(length = 6, pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
    let str = "";

    while (length-- > 0) {
        str += pool[(Math.floor(pool.length * Math.random()))];
    }

    return str;
}

export function generateElementId(fn) {
    let id;
    do {
        let rnd = randomStr();
        id = fn ? fn(rnd) : rnd;
    } while (document.getElementById(id));
    return id;
}
