const del = require('del');

(async () => {
    await del(['cli/**/*.js', '!cli/node_modules/**/*.js']);
})();