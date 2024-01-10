function findParent(items, level) {
    for (let i = items.length-1; i >= 0; --i) {
        if (items[i].level < level)
            return items[i];
    }
    return null;
}

function findSibling(items, level) {
    for (let i = items.length-1; i >= 0; --i) {
        if (items[i].level == level)
            return items[i];
        if (items[i].level < level)
            return null;
    }
    return null;
}

const whitespaceRe = /\s/
function isWhitespace(c) {
  return whitespaceRe.test(c)
}

function skipWhitespace(ln, p) {
    while (isWhitespace(ln[p])) {
        p += 1;
    }
    return p;
}

function readUntil(ln, p, sep) {
    let res = "";
    while (p < ln.length && !sep.includes(ln[p])) {
        if (ln[p] == "\\") {
            res += ln[p+1];
            p += 2
        }
        else {
            res += ln[p];
            p += 1;
        }
    }
    return [p, res];
}

const multiTags = ['->', '<-', '^', 'leftTo', 'rightTo', 'above', 'below', 'near'];

function parseTag(ln, p0, tags) {
    let val = true;
    let [p, name] = readUntil(ln, p0, [' ', ':']);
    p = skipWhitespace(ln, p);
    if (ln[p] != ":") {
        [p, val] = readUntil(ln, p, ":");
    }
    if (multiTags.includes(name))
        tags[name].push(val);
    else
        tags[name] = val;
    return p+1;
}

function parseHeading(ln) {
    let p = 0;

    let level = 0;
    if (ln[p] == '*')
        while (ln[p] == '*') {
            level += 1;
            p += 1;
        }
    else if (ln[p] == '>' || ln[p] == '&') {
        p += 1;
    }
    p = skipWhitespace(ln, p);

    const tags = {}
    for (let n of multiTags) {
        tags[n] = [];
    }
    while (ln[p] == ':') {
        p = parseTag(ln, p+1, tags);
        while (!isWhitespace(ln[p]) && p < ln.length) {
            p = parseTag(ln, p, tags);
        }
        p = skipWhitespace(ln, p);
    }

    let title = "";
    [p, title] = readUntil(ln, p, ":");
    while (ln[p] == ':') {
        p = parseTag(ln, p+1, tags);
        while (!isWhitespace(ln[p]) && p < ln.length) {
            p = parseTag(ln, p, tags);
        }
        p = skipWhitespace(ln, p);
    }

    return {
        level: level,
        name: title,
        content: "",
        tags: tags
    };
}

export
function parse(s) {
    const items = [];
    const links = [];
    const constraints = [];

    const namedItems = {};
    const processTags = (item) => {
        if (item.tags.id) {
            namedItems[item.tags.id] = item;
        }
    }

    let pos = 0;
    for (const ln of s.split("\n")) {
        if (ln.startsWith("*")) {
            const item = {...parseHeading(ln), index: items.length, cursorPos: pos};
            processTags(item);
            const sibling = null; // findSibling(items, item.level);
            const parent = findParent(items, item.level);
            items.push(item);

            if (parent) {
                links.push({source: parent, target: item, kind: "child"});
                constraints.push({axis: "x", left: parent.index, right: item.index, gap: 10});
            }
            if (sibling) {
                //links.push({source: sibling, target: item, kind: "sibling"});
                //constraints.push({axis: "y", left: sibling.index, right: item.index, gap: 10});
                //constraints.push({axis: "y", left: item.index, right: sibling.index, gap: -10});
            }
        }
        else if (ln.startsWith('>')) {
            const parent = items[items.length-1];
            const item = {...parseHeading(ln), index: items.length, level: parent.level+1, cursorPos: pos};
            processTags(item);
            items.push(item)
            links.push({source: parent, target: item, kind: "child"});
            constraints.push({axis: "x", left: parent.index, right: item.index, gap: 10});
        }
        else if (ln.startsWith('&')) {
            const item = {...parseHeading(ln), index: items.length, level: Infinity, cursorPos: pos};
            processTags(item);
            items.push(item)
        }
        else if (ln.startsWith(';')) {
        }
        else {
            if (items.length > 0)
                items[items.length-1].content += "\n" + ln;
        }
        pos += ln.length+1;
    }

    for (const item of items) {
        for (let id of item.tags["->"]) {
            const ref = namedItems[id];
            if (ref)
                links.push({source: item, target: ref, kind: "far"});
        }
        for (let id of item.tags["<-"]) {
            const ref = namedItems[id];
            if (ref)
                links.push({source: ref, target: item, kind: "far"});
        }
        for (let id of item.tags["^"]) {
            const ref = namedItems[id];
            if (ref) {
                links.push({source: ref, target: item, kind: "child"});
                for (let i = links.length-2; i >= 0; --i) {
                    if (links[i].source == ref && links[i].kind == "child") {
                        links.push({source: links[i].target, target: L.target, kind: "sibling"});
                        break;
                    }
                }
            }
        }
        for (let id of item.tags["near"]) {
            const ref = namedItems[id];
            if (ref) {
                links.push({source: ref, target: item, kind: "dummy"})
            }
        }
        for (let id of item.tags["leftTo"]) {
            const ref = namedItems[id];
            if (ref) {
                constraints.push({axis: "x", left: item.index, right: ref.index, gap: 10});
            }
        }
        for (let id of item.tags["rightTo"]) {
            const ref = namedItems[id];
            if (ref) {
                constraints.push({axis: "x", left: ref.index, right: item.index, gap: 10});
            }
        }
        for (let id of item.tags["above"]) {
            const ref = namedItems[id];
            if (ref) {
                constraints.push({axis: "y", left: item.index, right: ref.index, gap: 10});
            }
        }
        for (let id of item.tags["below"]) {
            const ref = namedItems[id];
            if (ref) {
                constraints.push({axis: "y", left: ref.index, right: item.index, gap: 10});
            }
        }
    }


    items.forEach(I => {I.x = 150*(I.level != Infinity ? I.level : 0); I.y = 150*I.index});

    return {items, links, constraints};
}