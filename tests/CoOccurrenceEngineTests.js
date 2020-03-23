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

fluid.setLogging(true);

fluid.require("node-jqunit");

require("../index.js");
require("../src/test/RecipeTestGrades.js");
require("../src/test/TestUtils.js");

// Base testEnvironment

fluid.defaults("fluid.tests.nexus.coOccurrenceEngineTestEnvironment", {
    gradeNames: ["fluid.test.testEnvironment", "fluid.nexus.componentRootHolder"],
    components: {
        componentRoot: {
            type: "fluid.nexus.componentRoot",
            options: {
                components: {
                    recipes: {
                        type: "fluid.component"
                    }
                }
            }
        },
        coOccurrenceEngine : {
            type: "fluid.nexus.coOccurrenceEngine",
            options: {
                components: {
                    componentRoot: "{coOccurrenceEngineTestEnvironment}.componentRoot"
                },
                listeners: {
                    onComponentCreated: {
                        funcName: "fluid.tests.nexus.coOccurrenceEngine.fireComponentGradeEvent",
                        args: [
                            "{arguments}.0",
                            {
                                "fluid.test.nexus.recipeX.product": "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductCreated",
                                "fluid.test.nexus.recipeY.product": "{coOccurrenceEngineTestEnvironment}.events.onRecipeYProductCreated"
                            }
                        ]
                    },
                    onComponentDestroyed: {
                        funcName: "fluid.tests.nexus.coOccurrenceEngine.fireComponentGradeEvent",
                        args: [
                            "{arguments}.0",
                            {
                                "fluid.test.nexus.recipeX.product": "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductDestroyed",
                                "fluid.test.nexus.recipeY.product": "{coOccurrenceEngineTestEnvironment}.events.onRecipeYProductDestroyed"
                            }
                        ]
                    }
                }
            }
        }
    },
    events: {
        onRecipeXProductCreated: null,
        onRecipeYProductCreated: null,
        onRecipeXAndYProductCreated: {
            events: {
                eventX: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductCreated",
                eventY: "{coOccurrenceEngineTestEnvironment}.events.onRecipeYProductCreated"
            },
            args: ["{arguments}.eventX.0", "{arguments}.eventY.0"]
        },
        onRecipeXProductDestroyed: null,
        onRecipeYProductDestroyed: null,
        onRecipeXAndYProductDestroyed: {
            events: {
                eventX: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductDestroyed",
                eventY: "{coOccurrenceEngineTestEnvironment}.events.onRecipeYProductDestroyed"
            },
            args: ["{arguments}.eventX.0", "{arguments}.eventY.0"]
        }
    }
});

// Tests

fluid.defaults("fluid.tests.nexus.coOccurrenceEngineConstructionTests", {
    gradeNames: ["fluid.tests.nexus.coOccurrenceEngineTestEnvironment"],
    components: {
        coOccurrenceEngineConstructionTester: {
            type: "fluid.tests.nexus.coOccurrenceEngineConstructionTester"
        }
    }
});

fluid.defaults("fluid.tests.nexus.coOccurrenceEngineConstructionTester", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [ {
        name: "Nexus Co-Occurrence Engine construction tests",
        tests: [
            {
                name: "Construct reactants and verify product created",
                expect: 7,
                sequence: [
                    // Add recipeX
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "recipes.recipeX",
                            {
                                type: "fluid.test.nexus.recipeX"
                            }
                        ]
                    },
                    // Start with no reactants and verify that no recipe
                    // product exists
                    {
                        func: "jqUnit.assertNoValue",
                        args: [
                            "No product existing",
                            "{coOccurrenceEngine}.componentRoot.recipeXProduct"
                        ]
                    },
                    // Add reactant A and reactant B and verify that the
                    // product for recipe X is created
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "reactantA",
                            {
                                type: "fluid.test.nexus.reactantA"
                            }
                        ]
                    },
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "reactantB",
                            {
                                type: "fluid.test.nexus.reactantB"
                            }
                        ]
                    },
                    {
                        event: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductCreated",
                        listener: "jqUnit.assertValue",
                        args: [
                            "Recipe X product created",
                            "{coOccurrenceEngine}.componentRoot.recipeXProduct"
                        ]
                    },
                    // Exercise the model relay rules and verify
                    {
                        func: "{coOccurrenceEngine}.componentRoot.reactantA.applier.change",
                        args: [ "valueA", 42 ]
                    },
                    {
                        changeEvent: "{coOccurrenceEngine}.componentRoot.reactantB.applier.modelChanged",
                        path: "valueB",
                        listener: "jqUnit.assertEquals",
                        args: [
                            "Reactant B model updated",
                            84,
                            "{arguments}.0"
                        ]
                    },
                    // Destroy reactant A and verify that:
                    // 1. the product is destroyed
                    // 2. reactant B is not destroyed
                    {
                        func: "{coOccurrenceEngine}.componentRoot.reactantA.destroy"
                    },
                    {
                        event: "{coOccurrenceEngine}.componentRoot.reactantA.events.onDestroy",
                        listener: "fluid.identity"
                    },
                    {
                        event: "{coOccurrenceEngine}.componentRoot.recipeXProduct.events.afterDestroy",
                        listener: "jqUnit.assertNoValue",
                        args: [
                            "Reactant A has been removed from the component root",
                            "@expand:fluid.nexus.componentForPathInContainer({coOccurrenceEngine}.componentRoot, reactantA)"
                        ]
                    },
                    {
                        func: "jqUnit.assertValue",
                        args: [
                            "Reactant B has not been removed from the component root",
                            "@expand:fluid.nexus.componentForPathInContainer({coOccurrenceEngine}.componentRoot, reactantB)"
                        ]
                    },
                    // Make another reactant A and verify that the
                    // product is created again and wired with the
                    // existing reactant B
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "anotherReactantA",
                            {
                                type: "fluid.test.nexus.reactantA"
                            }
                        ]
                    },
                    {
                        event: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductCreated",
                        listener: "jqUnit.assertValue",
                        args: [
                            "Recipe X product created",
                            "{coOccurrenceEngine}.componentRoot.recipeXProduct"
                        ]
                    },
                    {
                        func: "{coOccurrenceEngine}.componentRoot.anotherReactantA.applier.change",
                        args: [ "valueA", 8 ]
                    },
                    {
                        changeEvent: "{coOccurrenceEngine}.componentRoot.reactantB.applier.modelChanged",
                        path: "valueB",
                        listener: "jqUnit.assertEquals",
                        args: [
                            "Reactant B model updated",
                            16,
                            "{arguments}.0"
                        ]
                    }
                ]
            }
        ]
    } ]
});

fluid.defaults("fluid.tests.nexus.coOccurrenceEngineReactantInMultipleProductsTests", {
    gradeNames: ["fluid.tests.nexus.coOccurrenceEngineTestEnvironment"],
    components: {
        coOccurrenceEngineReactantInMultipleProductsTester: {
            type: "fluid.tests.nexus.coOccurrenceEngineReactantInMultipleProductsTester"
        }
    }
});

fluid.defaults("fluid.tests.nexus.coOccurrenceEngineReactantInMultipleProductsTester", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [ {
        name: "Nexus Co-Occurrence Engine reactant in multiple products tests",
        tests: [
            {
                name: "Reactant as member of multiple products",
                expect: 5,
                sequence: [
                    // Add recipeX and recipeY
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "recipes.recipeX",
                            {
                                type: "fluid.test.nexus.recipeX"
                            }
                        ]
                    },
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "recipes.recipeY",
                            {
                                type: "fluid.test.nexus.recipeY"
                            }
                        ]
                    },
                    // Check that no recipe products exist
                    {
                        func: "jqUnit.assertNoValue",
                        args: [
                            "No product X existing",
                            "{coOccurrenceEngine}.componentRoot.recipeXProduct"
                        ]
                    },
                    {
                        func: "jqUnit.assertNoValue",
                        args: [
                            "No product Y existing",
                            "{coOccurrenceEngine}.componentRoot.recipeYProduct"
                        ]
                    },
                    // Add reactant A and reactant B and verify that the
                    // products for recipes X and Y are both created
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "reactantB",
                            {
                                type: "fluid.test.nexus.reactantB"
                            }
                        ]
                    },
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "reactantA",
                            {
                                type: "fluid.test.nexus.reactantA"
                            }
                        ]
                    },
                    {
                        event: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXAndYProductCreated",
                        listener: "jqUnit.assertValue",
                        args: [
                            "Recipe X product created",
                            "{coOccurrenceEngine}.componentRoot.recipeXProduct"
                        ]
                    },
                    {
                        func: "jqUnit.assertValue",
                        args: [
                            "Recipe Y product created",
                            "{coOccurrenceEngine}.componentRoot.recipeYProduct"
                        ]
                    },
                    // Destroy reactant A and verify that the products
                    // for recipes X and Y are both destroyed
                    {
                        func: "{coOccurrenceEngine}.componentRoot.reactantA.destroy"
                    },
                    {
                        event: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXAndYProductDestroyed",
                        listener: "jqUnit.assert",
                        args: ["Products for recipes X and Y have both been destroyed"]
                    }
                ]
            }
        ]
    } ]
});

fluid.defaults("fluid.tests.nexus.coOccurrenceEngineRecipeAfterReactantsTests", {
    gradeNames: ["fluid.tests.nexus.coOccurrenceEngineTestEnvironment"],
    components: {
        coOccurrenceEngineRecipeAfterReactantsTester: {
            type: "fluid.tests.nexus.coOccurrenceEngineRecipeAfterReactantsTester"
        }
    }
});

fluid.defaults("fluid.tests.nexus.coOccurrenceEngineRecipeAfterReactantsTester", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [ {
        name: "Nexus Co-Occurrence Engine add recipe after reactants tests",
        tests: [
            {
                name: "Add recipe after reactants",
                expect: 2,
                sequence: [
                    // Add reactants A and reactant B
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "reactantA",
                            {
                                type: "fluid.test.nexus.reactantA"
                            }
                        ]
                    },
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "reactantB",
                            {
                                type: "fluid.test.nexus.reactantB"
                            }
                        ]
                    },
                    // Check that no recipe X product exist
                    {
                        func: "jqUnit.assertNoValue",
                        args: [
                            "No recipe X product existing",
                            "{coOccurrenceEngine}.componentRoot.recipeXProduct"
                        ]
                    },
                    // Add recipeX and verify that the product is created
                    {
                        func: "fluid.nexus.constructInContainer",
                        args: [
                            "{coOccurrenceEngine}.componentRoot",
                            "recipes.recipeX",
                            {
                                type: "fluid.test.nexus.recipeX"
                            }
                        ]
                    },
                    {
                        event: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductCreated",
                        listener: "jqUnit.assertValue",
                        args: [
                            "Recipe X product created",
                            "{coOccurrenceEngine}.componentRoot.recipeXProduct"
                        ]
                    }
                ]
            }
        ]
    } ]
});

fluid.test.runTests([
    "fluid.tests.nexus.coOccurrenceEngineConstructionTests",
    "fluid.tests.nexus.coOccurrenceEngineReactantInMultipleProductsTests",
    "fluid.tests.nexus.coOccurrenceEngineRecipeAfterReactantsTests"
]);
