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

fluid.require("node-jqunit");

require("../index.js");
require("../src/test/RecipeTestGrades.js");
require("../src/test/TestUtils.js");

// Component Root with Recipe

fluid.defaults("gpii.tests.nexus.coOccurrenceEngine.componentRoot", {
    gradeNames: ["fluid.component"],
    components: {
        recipes: {
            type: "fluid.component",
            options: {
                components: {
                    recipeX: {
                        type: "gpii.test.nexus.recipeX"
                    }
                }
            }
        }
    }
});

// Base testEnvironment

fluid.defaults("gpii.tests.nexus.coOccurrenceEngineTestEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    components: {
        componentRoot: {
            type: "gpii.tests.nexus.coOccurrenceEngine.componentRoot"
        },
        coOccurrenceEngine : {
            type: "gpii.nexus.coOccurrenceEngine",
            options: {
                components: {
                    componentRoot: "{coOccurrenceEngineTestEnvironment}.componentRoot"
                },
                listeners: {
                    onComponentCreated: {
                        funcName: "gpii.tests.nexus.coOccurrenceEngine.fireComponentGradeEvent",
                        args: [
                            "{arguments}.0",
                            {
                                "gpii.test.nexus.recipeX.product": "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductCreated",
                                "gpii.test.nexus.recipeY.product": "{coOccurrenceEngineTestEnvironment}.events.onRecipeYProductCreated"
                            }
                        ]
                    },
                    onComponentDestroyed: {
                        funcName: "gpii.tests.nexus.coOccurrenceEngine.fireComponentGradeEvent",
                        args: [
                            "{arguments}.0",
                            {
                                "gpii.test.nexus.recipeX.product": "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductDestroyed",
                                "gpii.test.nexus.recipeY.product": "{coOccurrenceEngineTestEnvironment}.events.onRecipeYProductDestroyed"
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

fluid.defaults("gpii.tests.nexus.coOccurrenceEngineConstructionTests", {
    gradeNames: ["gpii.tests.nexus.coOccurrenceEngineTestEnvironment"],
    components: {
        coOccurrenceEngineConstructionTester: {
            type: "gpii.tests.nexus.coOccurrenceEngineConstructionTester"
        }
    }
});

fluid.defaults("gpii.tests.nexus.coOccurrenceEngineConstructionTester", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [ {
        name: "Nexus Co-Occurrence Engine construction tests",
        tests: [
            {
                name: "Construct reactants and verify product created",
                expect: 7,
                sequence: [
                    // Start with no reactants and verify that no recipe
                    // product exists
                    {
                        func: "jqUnit.assertNoValue",
                        args: [
                            "No product existing",
                            "{componentRoot}.recipeXProduct"
                        ]
                    },
                    // Add reactant A and reactant B and verify that the
                    // product for recipe X is created
                    {
                        func: "gpii.nexus.constructInContainer",
                        args: [
                            "{componentRoot}",
                            "reactantA",
                            {
                                type: "gpii.test.nexus.reactantA"
                            }
                        ]
                    },
                    {
                        func: "gpii.nexus.constructInContainer",
                        args: [
                            "{componentRoot}",
                            "reactantB",
                            {
                                type: "gpii.test.nexus.reactantB"
                            }
                        ]
                    },
                    {
                        event: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductCreated",
                        listener: "jqUnit.assertValue",
                        args: [
                            "Recipe X product created",
                            "{componentRoot}.recipeXProduct"
                        ]
                    },
                    // Exercise the model relay rules and verify
                    {
                        func: "{componentRoot}.reactantA.applier.change",
                        args: [ "valueA", 42 ]
                    },
                    {
                        changeEvent: "{componentRoot}.reactantB.applier.modelChanged",
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
                        func: "{componentRoot}.reactantA.destroy"
                    },
                    {
                        event: "{componentRoot}.reactantA.events.onDestroy",
                        listener: "fluid.identity"
                    },
                    {
                        event: "{componentRoot}.recipeXProduct.events.afterDestroy",
                        listener: "jqUnit.assertNoValue",
                        args: [
                            "Reactant A has been removed from the component root",
                            "@expand:gpii.nexus.componentForPathInContainer({componentRoot}, reactantA)"
                        ]
                    },
                    {
                        func: "jqUnit.assertValue",
                        args: [
                            "Reactant B has not been removed from the component root",
                            "@expand:gpii.nexus.componentForPathInContainer({componentRoot}, reactantB)"
                        ]
                    },
                    // Make another reactant A and verify that the
                    // product is created again and wired with the
                    // existing reactant B
                    {
                        func: "gpii.nexus.constructInContainer",
                        args: [
                            "{componentRoot}",
                            "anotherReactantA",
                            {
                                type: "gpii.test.nexus.reactantA"
                            }
                        ]
                    },
                    {
                        event: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXProductCreated",
                        listener: "jqUnit.assertValue",
                        args: [
                            "Recipe X product created",
                            "{componentRoot}.recipeXProduct"
                        ]
                    },
                    {
                        func: "{componentRoot}.anotherReactantA.applier.change",
                        args: [ "valueA", 8 ]
                    },
                    {
                        changeEvent: "{componentRoot}.reactantB.applier.modelChanged",
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

fluid.defaults("gpii.tests.nexus.coOccurrenceEngineReactantInMultipleProductsTests", {
    gradeNames: ["gpii.tests.nexus.coOccurrenceEngineTestEnvironment"],
    components: {
        coOccurrenceEngineReactantInMultipleProductsTester: {
            type: "gpii.tests.nexus.coOccurrenceEngineReactantInMultipleProductsTester"
        }
    }
});

fluid.defaults("gpii.tests.nexus.coOccurrenceEngineReactantInMultipleProductsTester", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [ {
        name: "Nexus Co-Occurrence Engine reactant in multiple products tests",
        tests: [
            {
                name: "Reactant as member of multiple products",
                expect: 5,
                sequence: [
                    // Check that no recipe products exist
                    {
                        func: "jqUnit.assertNoValue",
                        args: [
                            "No product X existing",
                            "{componentRoot}.recipeXProduct"
                        ]
                    },
                    {
                        func: "jqUnit.assertNoValue",
                        args: [
                            "No product Y existing",
                            "{componentRoot}.recipeYProduct"
                        ]
                    },
                    // Add recipeY
                    {
                        func: "gpii.nexus.constructInContainer",
                        args: [
                            "{componentRoot}",
                            "recipes.recipeY",
                            {
                                type: "gpii.test.nexus.recipeY"
                            }
                        ]
                    },
                    // Add reactant A and reactant B and verify that the
                    // products for recipes X and Y are both created
                    {
                        func: "gpii.nexus.constructInContainer",
                        args: [
                            "{componentRoot}",
                            "reactantB",
                            {
                                type: "gpii.test.nexus.reactantB"
                            }
                        ]
                    },
                    {
                        func: "gpii.nexus.constructInContainer",
                        args: [
                            "{componentRoot}",
                            "reactantA",
                            {
                                type: "gpii.test.nexus.reactantA"
                            }
                        ]
                    },
                    {
                        event: "{coOccurrenceEngineTestEnvironment}.events.onRecipeXAndYProductCreated",
                        listener: "jqUnit.assertValue",
                        args: [
                            "Recipe X product created",
                            "{componentRoot}.recipeXProduct"
                        ]
                    },
                    {
                        func: "jqUnit.assertValue",
                        args: [
                            "Recipe Y product created",
                            "{componentRoot}.recipeYProduct"
                        ]
                    },
                    // Destroy reactant A and verify that the products
                    // for recipes X and Y are both destroyed
                    {
                        func: "{componentRoot}.reactantA.destroy"
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

// TODO: Test making a product at add recipe

fluid.test.runTests([
    "gpii.tests.nexus.coOccurrenceEngineConstructionTests",
    "gpii.tests.nexus.coOccurrenceEngineReactantInMultipleProductsTests"
]);
