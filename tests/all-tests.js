/*
Copyright 2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://raw.githubusercontent.com/GPII/co-occurrence-engine/master/LICENSE.txt
*/

/* eslint-env node */

"use strict";

var fluid = require("infusion");

var tests = [
    "./CoOccurrenceEngineTests.js",
    "./NexusWithCoOccurrenceEngineTests.js",
    "./RecipeMatcherTests.js",
    "./RecipeProductWiringTests.js"
];

fluid.each(tests, function (path) {
    require(path);
});
