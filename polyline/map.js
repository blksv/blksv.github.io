import * as polyline from "./polyline.js";

let map = null;
let line = null;

let state = {
    editing: false,
    activeTab: 'polyline'
};

function setClass(elem, classname, cond) {
    elem.classList[cond ? 'add' : 'remove'](classname);
}

export
function setState(s) {
    state = {...state, ...s};
    setClass(polylineInputLabel, "active", state.activeTab == 'polyline');
    setClass(coordsInputLabel, "active", state.activeTab == 'coords');
    setClass(donateTabLabel, "active", state.activeTab == 'donate');
    setClass(polylineTab, "hidden", state.activeTab != 'polyline');
    setClass(coordsTab, "hidden", state.activeTab != 'coords');
    setClass(donateTab, "hidden", state.activeTab != 'donate');
    setClass(continueFwdBtn, "hidden", !state.editing);
    setClass(continueBwdBtn, "hidden", !state.editing);
    setClass(commitBtn, "hidden", !state.editing);
    setClass(clearBtn, "hidden", state.editing || (!polylineInput.value && !coordsInput.value));
}

export
function decodePolyline() {
    const coords = polyline.decode(polylineInput.value);
    if (line)
        map.removeLayer(line);
    line = L.polyline(coords, {
        className: "polyline"
    }).addTo(map);
    map.fitBounds(line.getBounds().pad(0.5));

    coordsInput.value = coords.map(c => `${c[0].toFixed(5)} ${c[1].toFixed(5)}`).join("\n");
    setState({});
}

export
function encodeCoords() {
    const coords = [];
    for (let ln of coordsInput.value.split("\n")) {
        const [lat, lon] = ln.split(" ");
        coords.push([Number(lat), Number(lon)]);
    }
    polylineInput.value = polyline.encode(coords);
    decodePolyline();
}


export
function showMap() {
    map = L.map('map', {
        zoomControl: false,
        minZoom: 3,
        editable: true
    });
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.setView([56.90, 40.71], 3);
    setState({});
    L.DomEvent.disableClickPropagation(mapControls);
}

function onDraw(e) {
    const coords = e.layer.getLatLngs().map(o => [o.lat, o.lng]);
    polylineInput.value = polyline.encode(coords);
    decodePolyline();
    setState({editing: false});
}

export
function editLine() {
    if (polylineInput.value.length > 0)
        decodePolyline();
    else if (coordsInput.value.length > 0)
        encodePolyline();

    if (!line) {
        line = map.editTools.startPolyline();
        line.on('editable:drawing:commit', onDraw);
    }
    else {
        line.enableEdit();
        line.on('editable:drawing:commit', onDraw);
    }
    setState({editing: true});
}

export
function continueLine(backward) {
    if (backward)
        line.editor.continueBackward();
    else
        line.editor.continueForward();
}

export
function commit() {
    line.editor.commitDrawing();
}

export
function clear() {
    if (line) {
        map.removeLayer(line);
        line = null;
    }
    coordsInput.value = "";
    polylineInput.value = "";
    setState({});
}
