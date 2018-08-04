const SERVER_PORT = 3000;
const name = '';
const PUBLIC_DIR = __dirname + '/public';
const destPath = PUBLIC_DIR + '/js';

const config = require('./config.json');

const path = require('path');
const util = require('util');
const chalk = require('chalk');

const gulp = require('gulp');
const gulpSequence = require('gulp-sequence');

const sourcemaps = require('gulp-sourcemaps');
const rollup = require('gulp-better-rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

const babel = require('rollup-plugin-babel');

const {noop} = require('gulp-util');
const plumber = require('gulp-plumber');

const terser = require('gulp-minify');
const gzip = require('gulp-gzip');
const express = require('express');
const fs = require('fs');

const opn = require('opn');


const PHP_CGI_PATH = config['php-cgi-path'] || 'php-cgi';

const commandExists = require('command-exists');

const php_cgi = require('node-phpcgi')({
    documentRoot: PUBLIC_DIR,
    handler: PHP_CGI_PATH
});

let isDevMode = false;

/*console.log('argv string:', process.argv,"\n");*/

//const argv = require('minimist')(process.argv.slice(2));
const argv = require('yargs').argv;

/*console.log('Parsed:',util.inspect(argv));*/

const buildOptions = {
    minify: !!argv.minify,
    compress: !!argv.compress,
    sourcemaps: !!(argv.sourcemaps || argv.maps),
    external: !!argv.external,

    targets: {
        browsers: ['last 1 Chrome version']
    }
};


['node', 'browsers'].map(key => {
    if (key in argv) {
        const value = argv[key];
        if (typeof value !== 'string') {
            throw TypeError(`[${key}] option should be a string`);
        }

        buildOptions.targets[key] = value.split(/\s*,\s*/);
    }
});

console.log(`${chalk.blue('build options:')} 
    minify: ${buildOptions.minify}
    compress: ${buildOptions.compress}
    sourcemaps: ${buildOptions.sourcemaps}
    external: ${buildOptions.external}
    ${Object.keys(buildOptions.targets)
    .map(target => target + ': ' + buildOptions.targets[target].join(','))
    .join('\n\t')}
`);

function build(...entries) {
    return entries.map(entry => {

        let entryFile, format = 'cjs';

        if (Array.isArray(entry)) {
            ([entryFile, format] = entry)
        } else {
            entryFile = entry;
        }

        const name = path.basename(entryFile, '.js'),
            taskName = `build:${name}`;


        const {minify, compress, sourcemaps: buildSourcemaps, external, targets} = buildOptions;

        const presets = [
                ['env', {
                    targets,
                    modules: false,
                    exclude: ['web.dom.iterable', 'web.immediate', 'web.timers'],
                    useBuiltIns: true,
                    debug: true
                    //forceAllTransforms : minify
                }]
            ],
            plugins = [];

        gulp.task(taskName, () => {
            return gulp.src(entryFile)
                .pipe(isDevMode ? plumber() : noop())
                .pipe(buildSourcemaps ? sourcemaps.init() : noop())
                .pipe(rollup({
                    plugins: [
                        resolve({jsnext: true}),
                        commonjs({
                            include: 'node_modules/**'
                        }),
                        babel({
                            presets,
                            plugins
                        })
                    ],

                    preferConst: true
                }, {
                    name: name,
                    format
                }))

                .pipe(minify ? terser({
                    ext: {
                        min: ".js"
                    },

                    noSource: true
                }) : noop())

                .pipe(buildSourcemaps ? sourcemaps.write(external ? './' : undefined) : noop())
                .pipe(gulp.dest(destPath))


                .pipe(minify ? gulp.dest(destPath) : noop())
                .pipe(compress ? gzip() : noop())
                .pipe(compress ? gulp.dest(destPath) : noop())
        });

        return taskName;
    });
}

gulp.task('build', build(
    'src/loader.js',
    'src/detect-console.js',
    'src/banner-script.js'
));

gulp.task('server:start', function () {

    const app = express();

    app.get('*.php', function (req, res, next) {
        req.headers['HTTP_CLIENT_IP'] = req.ip;
        php_cgi(req, res, next);
    });

    app.use(express.static('public'));

    const serverURL = `http://localhost:${SERVER_PORT}/`;

    app.listen(SERVER_PORT, function () {
        console.log(chalk.green(`Server listening on ${serverURL}`));
    });

    opn(serverURL);
});

gulp.task('watch', function () {
    console.log(chalk.green('File watcher started'));
    gulp.watch('./src/**/*.js', ['build'], function (file) {
        console.log(`File [${file.path}] has been changed`);
    })
});

gulp.task('php:check', function (done) {
    if (PHP_CGI_PATH === 'php-cgi') {
        commandExists(PHP_CGI_PATH, (err, exists) => {
            console.log('command status', exists);
            done(!exists ? new Error(
                `${PHP_CGI_PATH} cannot be found at global scope.\nYou can set the PHP CGI path in config.json`
            ) : null);
        });
    } else {
        const file = process.platform === "win32" ? PHP_CGI_PATH + '.exe' : PHP_CGI_PATH;
        fs.access(file, fs.constants.F_OK, (err) => {
            done(err ? new Error(`PHP CGI path ${file} is not valid`) : null);
        });
    }
});


gulp.task('start', ['build', 'php:check'], function () {
    gulpSequence('build', 'server:start', function (err) {
        if (err) {
            throw err;
        }
    });
});


gulp.task('default', ['start', 'watch'], function () {
    console.warn(chalk.green('Development mode activated'));

    isDevMode = true;
});

//console.log(project);

