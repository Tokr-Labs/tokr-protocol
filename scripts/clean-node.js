const del = require('del');

(async () => {
    await del(['node_modules', "**/node_modules"]);
})();