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

fluid.defaults("gpii.test.nexus.reactantA", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        valueA: 10
    }
});

fluid.defaults("gpii.test.nexus.reactantB", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        valueB: 20
    }
});

fluid.defaults("gpii.test.nexus.recipeX.product", {
    gradeNames: ["gpii.nexus.recipeProduct"],
    componentPaths: {
        componentA: null,
        componentB: null
    },
    components: {
        componentA: "@expand:fluid.componentForPath({recipeProduct}.options.componentPaths.componentA)",
        componentB: "@expand:fluid.componentForPath({recipeProduct}.options.componentPaths.componentB)"
    },
    modelRelay: [
        {
            source: "{componentA}.model.valueA",
            target: "{componentB}.model.valueB",
            forward: {
                excludeSource: "init"
            },
            singleTransform: {
                type: "fluid.transforms.linearScale",
                factor: 2
            }
        }
    ]
});

fluid.defaults("gpii.test.nexus.recipeX", {
    gradeNames: ["gpii.nexus.recipe"],
    reactants: {
        componentA: {
            match: {
                type: "gradeMatcher",
                gradeName: "gpii.test.nexus.reactantA"
            }
        },
        componentB: {
            match: {
                type: "gradeMatcher",
                gradeName: "gpii.test.nexus.reactantB"
            }
        }
    },
    product: {
        path: "recipeXProduct",
        options: {
            type: "gpii.test.nexus.recipeX.product"
        }
    }
});
