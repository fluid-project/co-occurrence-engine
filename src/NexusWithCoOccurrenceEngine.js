/*
Copyright 2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://raw.githubusercontent.com/fluid-project/co-occurrence-engine/master/LICENSE.txt
*/

/* eslint-env node */

"use strict";

var fluid = require("infusion");

fluid.require("%infusion-nexus");

fluid.defaults("fluid.nexus.nexusWithCoOccurrenceEngine", {
    gradeNames: ["fluid.nexus", "fluid.nexus.componentRootHolder"],
    components: {
        nexusComponentRoot: {
            type: "fluid.nexus.componentRoot",
            options: {
                components: {
                    recipes: {
                        type: "fluid.component"
                    }
                }
            }
        },
        coOccurrenceEngine: {
            type: "fluid.nexus.coOccurrenceEngine",
            options: {
                components: {
                    componentRoot: "{nexusWithCoOccurrenceEngine}.nexusComponentRoot"
                }
            }
        }
    }
});
