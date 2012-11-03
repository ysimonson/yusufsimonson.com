var CUBE_SIZE = 200;
var THETA = Math.cos(45 * Math.PI / 360);
var ALPHA = -Math.sin(45 * Math.PI / 360);

var visualizer = null;
var worker = null;

var PAGE_CONFIGS = {
    home: {
        color: {r: 251 / 255.0, g: 23 / 255.0, b: 76 / 255.0},
        pos: {x: 1400, y: 600, z: 1400}
    },

    projects: {
        color: {r: 255 / 255.0, g: 85 / 255.0, b: 0},
        pos: {x: 0, y: 600, z: 1400}
    },

    publications: {
        color: {r: 16 / 255.0, g: 127 / 255.0, b: 201 / 255.0},
        pos: {x: -1400, y: 600, z: 1400}
    }
}

function fade(fromElem, toElem) {
    if(fromElem.length) {
        fromElem.fadeOut(125, function() {
            toElem.fadeIn(125);
        });
    } else {
        toElem.fadeIn(125);
    }
}

function getPage() {
    var value = window.location.hash.substring(3);
    if(!(value in PAGE_CONFIGS)) value = "home";
    return value;
}

function initializeRenderer() {
    var config = PAGE_CONFIGS[getPage()];
    visualizer = new GameVisualizer(config.pos, config.color);
    worker = new Worker("/js/worker.js");

    worker.onmessage = function(e) {
        visualizer.nextGenerations = visualizer.nextGenerations.concat(e.data);
    };

    worker.postMessage({ size: CUBE_SIZE });

    $("body").css("background-image", "none");
}

$(window).hashchange(function() {
    var page = getPage();
    var config = PAGE_CONFIGS[page];
    var colorString = "rgb(" + config.color.r * 255.0 + ", " + config.color.g * 255.0 + ", " + config.color.b * 255.0 + ")";

    fade($(".page:visible"), $("#page-" + page));
    $("#menu a").css("border-bottom", "0");
    $("#link-" + page).css("border-bottom", "3px solid " + colorString);

    if(visualizer) {
        visualizer.setTransition(config.color, config.pos);
    }
});


$(function() {
    if(window.Worker && window.WebGLRenderingContext) {
        initializeRenderer();
    }

    $(window).hashchange();
});