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

fluid.require("node-jqunit");

require("../index.js");
require("../src/test/RecipeTestData.js");

// Component Root with Recipe

fluid.defaults("gpii.tests.nexus.coOccurrenceEngine.componentRoot", {
    gradeNames: ["fluid.component"],
    components: {
        recipes: {
            type: "fluid.component",
            options: {
                components: {
                    recipeA: {
                        type: "gpii.nexus.recipe",
                        options: {
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
                                path: "recipeAProduct",
                                options: {
                                    type: "gpii.test.nexus.recipeA.product"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});

// Tests

fluid.defaults("gpii.tests.nexus.coOccurrenceEngineTests", {
    gradeNames: ["fluid.test.testEnvironment"],
    components: {
        componentRoot: {
            type: "gpii.tests.nexus.coOccurrenceEngine.componentRoot"
        },
        coOccurrenceEngine : {
            type: "gpii.nexus.coOccurrenceEngine",
            options: {
                components: {
                    componentRoot: "{coOccurrenceEngineTests}.componentRoot"
                }
            }
        },
        coOccurrenceEngineTester: {
            type: "gpii.tests.nexus.coOccurrenceEngineTester"
        }
    }
});

fluid.defaults("gpii.tests.nexus.coOccurrenceEngineTester", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [ {
        name: "Nexus Co-Occurrence Engine tests",
        tests: [
            {
                name: "Construct reactants and verify product created",
                expect: 5,
                sequence: [
                    // Start with no reactants and verify that no recipe
                    // product exists
                    {
                        func: "jqUnit.assertNoValue",
                        args: [
                            "No product existing",
                            "{componentRoot}.recipeAProduct"
                        ]
                    },
                    // Add reactant A and reactant B and verify that the
                    // product for recipe A is created
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
                        event: "{coOccurrenceEngine}.events.onProductCreated",
                        listener: "jqUnit.assertValue",
                        args: [
                            "Recipe A product created",
                            "{componentRoot}.recipeAProduct"
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
                        event: "{componentRoot}.recipeAProduct.events.afterDestroy",
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
                    }

                    // TODO: Make another reactant A and verify that the
                    // product is created again and wired with the
                    // existing reactant B

                    // TODO: Test reactant as member of multiple
                    // products (including destroying the reactant)

                ]
            }
        ]
    } ]
});

fluid.test.runTests([ "gpii.tests.nexus.coOccurrenceEngineTests" ]);
