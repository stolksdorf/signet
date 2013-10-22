/*

    ||||||
    Signet   Adam Schwartz & Zack Bloom

    Display a unique seal in the developer console of your page.
    https://github.com/HubSpot/signet

    Settings:

    - signet.title             - string  - title of your page (required to show color bars signet)
    - signet.author            - string  - author of your page
    - signet.description       - string  - description of your page

    - signet.signet            - boolean - show color bars signet above the title
    - signet.hue               - integer - hue offset for the color bars

    - signet.baseStyles        - string  - base style string for all parst of the signet (best used to set base font or color)
    - signet.titleStyles       - string  - title styles
    - signet.authorStyles      - string  - author styles
    - signet.descriptionStyles - string  - description styles

*/

(function(){
    var autoInit, tag;

    window.signet = window.signet || {};
    window.signet.options = window.signet.options || window.signetOptions || {};

    if (!window.console || !window.console.log || !document.head || !document.querySelector) {
        window.signet.draw = function() {};
        return;
    }

    autoInit = true;
    tag = document.querySelector('[data-signet-draw]');
    if (tag)
        autoInit = (tag.getAttribute('data-signet-draw').toLowerCase() != 'false');
    if (signet.options.draw === false)
        autoInit = false;

    // Defer execution until the next event loop tick, but don't let anything be rendered to the console
    // until we can run our function.  This will break console.log line numbers, but only for the first tick.
    // The fn is passed a special console which will actually log immediately.
    function deferConsole(fn) {
        var messages, message, block, old, callable, types, type, i;

        types = ['log', 'debug', 'warn', 'error'];
        old = {};
        callable = {};
        messages = [];

        for (i = types.length; i--;) {
            (function(type){
                old[type] = console[type];

                callable[type] = function() {
                    old[type].apply(console, arguments);
                };

                console[type] = function() {
                    messages.push([type, arguments]);
                };
            })(types[i]);
        }

        setTimeout(function(){
            function then(){
                while (messages.length) {
                    block = messages.shift();
                    type = block[0];
                    message = block[1];

                    old[type].apply(console, message);
                }

                for (i = types.length; i--;) {
                    console[type] = old[type];
                }
            };

            fn(callable, then);
        }, 0);
    }

    function draw(options, _console, cb) {
        var i, img, args;

        _console = _console || window.console;

        options = options || window.signet.options || {
            enabled: true
        };

        if (options.enabled === false)
            return;

        function orDefault(){
            for (i = 0; i <= arguments.length; i++) {
                if (typeof arguments[i] !== 'undefined')
                    return arguments[i];
            }
            return arguments[arguments.length - 1];
        }

        function getContent(selector) {
            var el = document.head.querySelector(selector);

            if (el)
                return el.content;
            return undefined;
        }

        options.title = orDefault(options.title, getContent('meta[name="application-name"]'), getContent('meta[property="og:title"]'), document.title.split(/ [\/\\\|\-\u8211\u8212] |\: /)[0], '');
        options.author = orDefault(options.author, getContent('meta[name=author]'), '');
        options.description = orDefault(options.description, getContent('meta[name=description]'), getContent('meta[property="og:description"]'), '');

        options.image = orDefault(options.image, getContent('meta[property="og:image"]'), getContent('meta[name=image]'));

        options.hue = options.hue || 0;

        options.baseStyles = orDefault(options.baseStyles, 'color: #444; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;');

        options.titleStyles = orDefault(options.titleStyles, options.baseStyles + ';font-size: 20px; line-height: 30px;');
        options.authorStyles = orDefault(options.authorStyles, options.baseStyles + ';font-size: 12px; line-height: 30px; padding-left: 20px;');
        options.descriptionStyles = orDefault(options.descriptionStyles, options.baseStyles + ';font-size: 14px; line-height: 20px;');

        function _draw() {
            if (options.title) {
                if (!options.image) {
                    args = [''];
                    for (i = 0; i < options.title.length; i++) {
                        args[0] += '%c' + options.title[i];
                        if (options.title[i] === ' ') {
                            args.push(options.titleStyles);
                        } else {
                            args.push(options.titleStyles + '; background: hsl(' + (((options.title[i].toLowerCase().charCodeAt(0) * 2) + options.hue) % 255) + ', 80%, 80%); color: transparent; line-height: 0;');
                        }
                    }
                    _console.log.apply(console, args);
                }

                if (options.author)
                    _console.log('%c' + options.title + '%c' + options.author, options.titleStyles, options.authorStyles);
                else
                    _console.log('%c' + options.title, options.titleStyles);
            }

            if (options.description)
                _console.log('%c' + options.description, options.descriptionStyles);

            if (cb)
                cb();
        }

        if (!options.image) {
            _draw();
        } else {
            img = new Image();

            img.onload = function() {
                _console.log('%c ', 'font-size: 0; line-height: ' + img.height + 'px; padding: ' + Math.floor(img.height / 2) + 'px ' + img.width + 'px ' + Math.ceil(img.height / 2) + 'px 0; background-image: url("' + img.src + '");');
                _draw();
            };

            img.src = options.image;
        }
    }

    if (autoInit) {
        deferConsole(function(_console, then){
            draw(null, _console, then);
        });
    }

    window.signet.draw = draw;
})();
