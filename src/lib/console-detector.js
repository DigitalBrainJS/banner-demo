
const timingDetection = (() => {

    const dummyObj = {},
        members = [];

    for (let i = 0; i < 10; i++) {
        dummyObj[i] = {};
    }

    let supportUSResolution = () => {
        for (let i = 0; i < 5; i++) {
            if (performance.now() % 1) return true;
        }
        return false;
    };


    const supportPerformanceAPI = performance && typeof performance.now === 'function',
        now = supportPerformanceAPI ? () => performance.now() : () => Date.now(),
        supportHighResolutionTimer = supportPerformanceAPI && supportUSResolution(),
        membersCount = supportHighResolutionTimer ? 5 : 25,
        diffTimingThreshold = 5;

    for (let i = 0; i < membersCount; i++) {
        members.push("%c", dummyObj);
    }

    console.log('supportPerformanceAPI', supportPerformanceAPI);
    console.log('supportHighResolutionTimer', supportHighResolutionTimer);
    console.log('diffTimingThreshold', diffTimingThreshold);

    function testEmptyOutput() {
        const start = now();

        console.log('');

        return now() - start;
    }

    function testHeavyOutput() {
        const start = now();
        console.log.apply(console, members);
        return now() - start;
    }

    return () => {
        let t1 = testEmptyOutput(),
            t2 = testHeavyOutput();

        if (t1 <= 0) {
            return t2 > diffTimingThreshold;
        }

        return (t2 / t1) > diffTimingThreshold;
    }
})();


export default function detect(useWindowSizesDetection= false) {
    return new Promise((resolve, reject)=>{
        if (window.Firebug && window.Firebug.chrome) {
            console.log('%cUse window.Firebug.chrome api', 'color: blue');
            resolve(window.Firebug.chrome.isInitialized);
        }

        if (console.profiles) {
            console.log('%cUse console.profile hack', 'color: blue');
            console.profile();
            console.profileEnd();
            resolve(!!console.profiles.length);
        }

        const userAgent = navigator.userAgent;

        console.log(userAgent);

        const browser= ['MSIE', 'Opera', 'Chrome', 'FireFox', ['MSIE', 'Trident/', 'rv.([\\.\\d]+)']].reduce((detected, signature)=> {

            if(detected) return detected;

            let name= signature, match, version;

            if(typeof signature=='string'){
                match= new RegExp(`${signature}[\/\s]([\\.\\d]+)`, 'i').exec(userAgent);
            }else{
                name= signature[0];

                const signatures= signature.slice(1).every(signature=>{
                    match= new RegExp(signature, 'i').exec(userAgent);
                    return match;
                });
            }



            return match && {name, version: match[1]};
        }, null);

        if(browser){
            console.log(`%cCurrent browser: ${browser.name} (${browser.version})`, 'color: green');
        }

        function timeout() {
            setTimeout(() => resolve(false), 0);
        }

        function compareVersion(version1, version2){

            const v1= version1.split('.'),
                v2= version2.split('.'),
                {length}= v1;

            for (let i = 0; i < length; i++) {
                if (v1[i] === v2[i]) {
                    continue;
                }

                return v1[i] < v2[i]? -1 : 1;
            }

            return 0;
        };

        function matchVersion(current, versions){

            if(!versions.length) return true;

            return versions.some(version=>{
                if(typeof version=='string'){
                    return !compareVersion(current, version);
                }else{
                    const m1= compareVersion(current, version[0]),
                        m2= compareVersion(current, version[1]);

                    if((m1===1 || !m1) && (m2===-1 || !m2)){
                        return true;
                    }
                }
            });

        }

        function matchBrowser(name, versions, cb, next){

            if(browser && name===browser.name && matchVersion(browser.version, versions)){
                cb(name);
                return;
            }

            next();
        }

        const dummyRE = /./;

        dummyRE.toString = function() {
            resolve(true);
            return '';
        };

        //Here we can use known hacks in specific browsers versions

        //67.0.3396.79 and older versions
        matchBrowser('Chrome', ['67.0.3396.79'], () => {
            console.log('%cUse RegExp.toString hack for Chrome', 'color: blue');
            console.log('%c', dummyRE);
            timeout();
        }, () => {
            //61.0 and older versions
            matchBrowser('FireFox', ['61.0'], () => {
                console.log('%cUse RegExp.toString hack for Firefox', 'color: blue');
                console.log(dummyRE);
                timeout();
            }, () => {
                const threshold = 100;

                console.log('%cUse timing diff hack', 'color: blue');

                resolve(
                    timingDetection() || (useWindowSizesDetection &&
                    window.outerWidth - window.innerWidth > threshold ||
                    window.outerHeight - window.innerHeight > threshold)
                );
            });
        });

/*      const date= new Date();

        date.toString=function(){
            try{
                throw new Error();
            }catch(e){
                //analyze e.stack in Chrome;
            }
        };

        console.log(date);*/
    });
}