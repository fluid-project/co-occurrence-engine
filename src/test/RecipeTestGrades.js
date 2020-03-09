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

fluid.defaults("fluid.test.nexus.reactantA", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        valueA: 10
    }
});

fluid.defaults("fluid.test.nexus.reactantB", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        valueB: 20
    }
});

fluid.defaults("fluid.test.nexus.recipeX.product", {
    gradeNames: ["fluid.nexus.recipeProduct"],
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

fluid.defaults("fluid.test.nexus.recipeX", {
    gradeNames: ["fluid.nexus.recipe"],
    reactants: {
        componentA: {
            match: {
                type: "gradeMatcher",
                gradeName: "fluid.test.nexus.reactantA"
            }
        },
        componentB: {
            match: {
                type: "gradeMatcher",
                gradeName: "fluid.test.nexus.reactantB"
            }
        }
    },
    product: {
        path: "recipeXProduct",
        options: {
            type: "fluid.test.nexus.recipeX.product"
        }
    }
});

fluid.defaults("fluid.test.nexus.recipeY.product", {
    gradeNames: ["fluid.nexus.recipeProduct"],
    componentPaths: {
        componentA: null
    },
    components: {
        componentA: "@expand:fluid.componentForPath({recipeProduct}.options.componentPaths.componentA)"
    }
});

fluid.defaults("fluid.test.nexus.recipeY", {
    gradeNames: ["fluid.nexus.recipe"],
    reactants: {
        componentA: {
            match: {
                type: "gradeMatcher",
                gradeName: "fluid.test.nexus.reactantA"
            }
        }
    },
    product: {
        path: "recipeYProduct",
        options: {
            type: "fluid.test.nexus.recipeY.product"
        }
    }
});
