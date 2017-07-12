/*
Copyright 2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://raw.githubusercontent.com/GPII/nexus/master/LICENSE.txt
*/

/* eslint-env node */

"use strict";

var fluid = require("infusion");

fluid.require("%gpii-nexus");

fluid.defaults("gpii.nexus.nexusWithCoOccurrenceEngine", {
    gradeNames: "gpii.nexus",
    components: {
        nexusComponentRoot: {
            type: "fluid.component",
            options: {
                components: {
                    recipes: {
                        type: "fluid.component"
                    }
                }
            }
        },
        coOccurrenceEngine: {
            type: "gpii.nexus.coOccurrenceEngine",
            options: {
                components: {
                    nexusComponentRoot: "{nexusWithCoOccurrenceEngine}.nexusComponentRoot"
                }
            }
        }
    }
});
