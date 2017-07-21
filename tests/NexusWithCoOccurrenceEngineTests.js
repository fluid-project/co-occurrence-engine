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
    kettle = require("kettle"),
    gpii = fluid.registerNamespace("gpii");

require("../index.js");
// TODO: Is using NexusTestUtils.js reasonable?
fluid.require("%gpii-nexus/src/test/NexusTestUtils.js");
require("../src/test/RecipeTestGrades.js");

kettle.loadTestingSupport();

fluid.registerNamespace("gpii.tests.nexus.nexusWithCoOccurrenceEngine");

// Tests

gpii.tests.nexus.nexusWithCoOccurrenceEngine.testDefs = [
    {
        name: "Add Recipe, construct reactants, and verify product created",
        gradeNames: "gpii.test.nexus.testCaseHolder",
        mergePolicy: {
            "testGradeOptions": "noexpand"
        },
        expect: 6,
        config: {
            configName: "gpii.tests.nexusWithCoOccurrenceEngine.config",
            configPath: "%gpii-co-occurrence-engine/tests/configs"
        },
        components: {
            addRecipeRequest: {
                type: "kettle.test.request.http",
                options: {
                    path: "/components/recipes.recipeX",
                    port: "{configuration}.options.serverPort",
                    method: "POST"
                }
            },
            constructReactantARequest: {
                type: "kettle.test.request.http",
                options: {
                    path: "/components/reactantA",
                    port: "{configuration}.options.serverPort",
                    method: "POST"
                }
            },
            constructReactantBRequest: {
                type: "kettle.test.request.http",
                options: {
                    path: "/components/reactantB",
                    port: "{configuration}.options.serverPort",
                    method: "POST"
                }
            },
            reactantAClient: {
                type: "kettle.test.request.ws",
                options: {
                    path: "/bindModel/reactantA/valueA",
                    port: "{configuration}.options.serverPort"
                }
            },
            reactantBClient: {
                type: "kettle.test.request.ws",
                options: {
                    path: "/bindModel/reactantB/valueB",
                    port: "{configuration}.options.serverPort"
                }
            }
        },
        sequence: [
            // Add our recipe
            {
                func: "{addRecipeRequest}.send",
                args: [{ type: "gpii.test.nexus.recipeX" }]
            },
            {
                event: "{addRecipeRequest}.events.onComplete",
                listener: "gpii.test.nexus.assertStatusCode",
                args: ["{addRecipeRequest}", 200]
            },
            // Construct the reactants and verify that the product is
            // created
            {
                func: "{constructReactantARequest}.send",
                args: [{ type: "gpii.test.nexus.reactantA" }]
            },
            {
                event: "{constructReactantARequest}.events.onComplete",
                listener: "gpii.test.nexus.assertStatusCode",
                args: ["{constructReactantARequest}", 200]
            },
            {
                func: "{constructReactantBRequest}.send",
                args: [{ type: "gpii.test.nexus.reactantB" }]
            },
            {
                event: "{gpii.nexus.coOccurrenceEngine}.events.onProductCreated",
                listener: "jqUnit.assertValue",
                args: [
                    "Recipe A product created",
                    "{nexusComponentRoot}.recipeXProduct"
                ]
            },
            {
                event: "{constructReactantBRequest}.events.onComplete",
                listener: "gpii.test.nexus.assertStatusCode",
                args: ["{constructReactantBRequest}", 200]
            },
            // Change reactant A's model and verify that the product
            // relay rules cause reactant B's model to be updated
            {
                func: "{reactantAClient}.connect"
            },
            {
                event: "{reactantAClient}.events.onConnect",
                listener: "fluid.identity"
            },
            {
                func: "{reactantBClient}.connect"
            },
            {
                event: "{reactantBClient}.events.onConnect",
                listener: "fluid.identity"
            },
            {
                event: "{reactantBClient}.events.onReceiveMessage",
                listener: "jqUnit.assertDeepEq",
                args: [
                    "Received initial message with the state of reactantB's model",
                    20,
                    "{arguments}.0"
                ]
            },
            {
                func: "{reactantAClient}.send",
                args: [
                    {
                        path: "",
                        value: 42
                    }
                ]
            },
            {
                event: "{reactantBClient}.events.onReceiveMessage",
                listener: "jqUnit.assertDeepEq",
                args: [
                    "Received change message from reactantB",
                    84,
                    "{arguments}.0"
                ]
            }
        ]
    }
];

kettle.test.bootstrapServer(gpii.tests.nexus.nexusWithCoOccurrenceEngine.testDefs);
