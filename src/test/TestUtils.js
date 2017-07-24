/*
Copyright 2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://raw.githubusercontent.com/GPII/co-occurrence-engine/master/LICENSE.txt
*/

/* eslint-env node */

"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.tests.nexus.coOccurrenceEngine");

gpii.tests.nexus.coOccurrenceEngine.fireComponentGradeCreated = function (component, gradeEvents) {
    fluid.each(gradeEvents, function (event, grade) {
        if (fluid.componentHasGrade(component, grade)) {
            event.fire(component);
        }
    });
};
