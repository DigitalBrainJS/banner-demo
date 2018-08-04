/********************************************************************
 This script will executed in the context of the banner container
 with some special local variables like "modules" & "container"
 ********************************************************************/
import detect from "./lib/console-detector"

const {JSONP} = module.imports;

/**
 * Without window client sizes detection
 */

detect(false).then(status => {
    JSONP.request('/banner.php', {
        action: "log-console",
        console: status,
    }).then(() => {
        console.log(`%cConsole status (${status ? 'opened' : 'closed'}) sent`, 'color:green');
    });
});



