(function(module) {
    "use strict";

    var MarkdownToc = {},
        cheerio = require('cheerio');

    MarkdownToc.parse = function(data, callback) {
        var postContent = data.postData.content;
        var titleRegexp = /<h([1-6])\s*.*?>(.*?)<\/h\1>/gm;
        var tocRegexp = /\[toc\]/mg;

        var titles = postContent.match(titleRegexp);
        var tocMatch = postContent.match(tocRegexp);

        if (!titles || !titles.length || !tocMatch || !tocMatch.length) {
            return callback(null, data); // No titles or [toc] found, return as is
        }

        var ids = [];
        var $ = cheerio.load('<div class="toc"></div>');

        titles.forEach(function(title) {
            var match = title.match(titleRegexp);
            if (!match) return; // Skip if no match

            var level = parseInt(match[1], 10);
            var text = match[2].trim();
            var id = generateUniqueId(text, ids);

            // Replace original heading with one that includes an ID
            postContent = postContent.replace(title, `<h${level} id="${id}">${text}</h${level}>`);

            // Create a list item for the TOC
            var li = $('<li>').append($('<a>', { href: '#' + id }).text(text));

            // Append to appropriate level in the TOC
            appendToToc(level, li, $);
        });

        // Insert the TOC into the content where [toc] is found
        postContent = postContent.replace(tocRegexp, $.html());
        data.postData.content = postContent;

        callback(null, data);
    };

    function generateUniqueId(text, ids) {
        let baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        let id = baseId;
        let suffix = 1;
        while (ids.includes(id)) {
            id = `${baseId}-${suffix}`;
            suffix++;
        }
        ids.push(id);
        return id;
    }

    function appendToToc(level, li, $) {
        let currentLevel = $('ul:last');
        while (currentLevel.parentsUntil('.toc', 'ul').length >= level - 1) {
            currentLevel = currentLevel.parent().closest('ul');
        }

        if (!currentLevel.length || currentLevel.parentsUntil('.toc', 'ul').length < level - 1) {
            currentLevel.append($('<ul>').append(li));
        } else {
            currentLevel.append(li);
        }
    }

    module.exports = MarkdownToc;
}(module));
