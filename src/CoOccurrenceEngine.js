/*
Copyright 2016, 2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://raw.githubusercontent.com/fluid-project/co-occurrence-engine/master/LICENSE.txt
*/

/* eslint-env node */

"use strict";

var fluid = require("infusion");

fluid.require("infusion-nexus");

fluid.defaults("fluid.nexus.recipe", {
    gradeNames: "fluid.component"
});

fluid.defaults("fluid.nexus.recipeProduct", {
    gradeNames: "fluid.modelComponent"
});

fluid.defaults("fluid.nexus.recipeMatcher", {
    gradeNames: "fluid.component",
    invokers: {
        matchRecipe: {
            funcName: "fluid.nexus.recipeMatcher.matchRecipe",
            args: [
                "{arguments}.0", // recipe to test
                "{arguments}.1"  // array of components
            ]
        }
    }
});

fluid.nexus.recipeMatcher.matchRecipe = function (recipe, components) {
    var matchedReactants = {};
    var foundAllReactants = true;
    fluid.each(recipe.options.reactants, function (reactant, reactantName) {
        var foundReactant = fluid.find(components, function (component) {
            if (fluid.nexus.recipeMatcher.componentMatchesReactantSpec(component, reactant.match)) {
                matchedReactants[reactantName] = component;
                return true;
            }
        });
        if (!foundReactant) {
            foundAllReactants = false;
        }
    });
    if (foundAllReactants) {
        return matchedReactants;
    } else {
        return false;
    }
};

// TODO: Copy the source for fluid.matchIoCSelector() and extend with
// other predicate types. To start, use the parsed version of the IoCSS
// expressions directly in the recipes (rather than implementing parsing
// logic for CSS-like syntax). In the future we could adopt a CSS-like
// syntax for the new predicate types.
//
// fluid.matchIoCSelector():
//
// https://github.com/fluid-project/infusion/blob/master/src/framework/core/js/FluidIoC.js#L322

fluid.nexus.recipeMatcher.componentMatchesReactantSpec = function (component, matchRules) {
    if (matchRules.type === "gradeMatcher") {
        return fluid.componentHasGrade(component, matchRules.gradeName);
    }
};

// fluid.nexus.componentRootHolder and fluid.nexus.componentRoot are marker grades
// used by the Co-Occurrence Engine distributeOptions rules. A Co-Occurrence
// Engine must be deployed under an ancestor with the grade
// fluid.nexus.componentRootHolder. And the component root must be a descendant
// of the componentRootHolder.

fluid.defaults("fluid.nexus.componentRootHolder", {
    gradeNames: ["fluid.component"]
});

fluid.defaults("fluid.nexus.componentRoot", {
    gradeNames: ["fluid.component"]
});

// TODO: Who names recipe products?
//       - Configured in each recipe; or
//       - Randomly assigned by the Co-Occurrence Engine

fluid.defaults("fluid.nexus.coOccurrenceEngine", {
    gradeNames: ["fluid.component"],
    members: {
        // TODO: Is "members" the best place for this map?

        // When a reactant is destroyed, we destroy any products that
        // the reactant is a member of. The "reactantRecipeMembership"
        // object is used to maintain a map from reactant component id
        // to product path and is consulted at reactant destruction.
        reactantRecipeMembership: {}
    },
    components: {
        // Commented out following definition for FLUID-6467
        // componentRoot: null, // To be provided by integrators
        recipesContainer: "{fluid.nexus.coOccurrenceEngine}.componentRoot.recipes",
        recipeMatcher: {
            type: "fluid.nexus.recipeMatcher"
        }
    },
    invokers: {
        getRecipes: {
            funcName: "fluid.nexus.coOccurrenceEngine.getRecipes",
            args: ["{that}.recipesContainer"]
        }
    },
    events: {
        onComponentCreated: null,
        onComponentDestroyed: null
    },
    listeners: {
        onComponentCreated: {
            funcName: "fluid.nexus.coOccurrenceEngine.componentCreated",
            args: [
                "{that}.componentRoot",
                "{that}.recipeMatcher",
                "@expand:{that}.getRecipes()",
                "{that}.reactantRecipeMembership"
            ]
        },
        onComponentDestroyed: {
            funcName: "fluid.nexus.coOccurrenceEngine.componentDestroyed",
            args: [
                "{that}.componentRoot",
                "{that}.reactantRecipeMembership",
                "{arguments}.0.id" // Id of component destroyed
            ]
        }
    },
    distributeOptions: [
        {
            target: "{fluid.nexus.componentRootHolder fluid.nexus.componentRoot fluid.component}.options.listeners",
            record: {
                "onCreate.fireCoOccurrenceEngineComponentCreated":
                    "{fluid.nexus.coOccurrenceEngine}.events.onComponentCreated",
                "afterDestroy.fireCoOccurrenceEngineComponentDestroyed":
                    "{fluid.nexus.coOccurrenceEngine}.events.onComponentDestroyed"
            },
            namespace: "coOccurrenceEngine"
        }
    ]
});

fluid.nexus.coOccurrenceEngine.getRecipes = function (recipesContainer) {
    var recipes = [];
    fluid.each(recipesContainer, function (recipe) {
        if (fluid.isComponent(recipe)
                && fluid.componentHasGrade(recipe, "fluid.nexus.recipe")) {
            recipes.push(recipe);
        }
    });
    return recipes;
};

fluid.nexus.coOccurrenceEngine.componentCreated = function (componentRoot, recipeMatcher, recipes, reactantRecipeMembership) {
    var components = [];

    // TODO: This will only collect direct children of componentRoot, do we want all descendants?
    // TODO: Maybe better to pass the componentRoot directly to the recipeMatcher and let it do the walking
    // TODO: This should use fluid.queryIoCSelector rather than a manual visitation
    fluid.each(componentRoot, function (component) {
        if (fluid.isComponent(component)) {
            components.push(component);
        }
    });

    if (components.length > 0) {
        fluid.each(recipes, function (recipe) {
            // Process the recipe if we don't already have a product
            // constructed for it
            var productPath = recipe.options.product.path;
            if (!fluid.nexus.containsComponent(componentRoot, productPath)) {
                var matchedReactants = recipeMatcher.matchRecipe(recipe, components);
                if (matchedReactants) {
                    // Extend product options with the reactant component paths
                    var productOptions = fluid.extend({
                        componentPaths: { }
                    }, recipe.options.product.options);
                    fluid.each(matchedReactants, function (reactantComponent, reactantName) {
                        productOptions.componentPaths[reactantName] = fluid.pathForComponent(reactantComponent);
                    });

                    // Record matchedReactants product membership
                    fluid.each(matchedReactants, function (reactantComponent) {
                        var reactantId = reactantComponent.id;
                        if (reactantRecipeMembership.hasOwnProperty(reactantId)) {
                            reactantRecipeMembership[reactantId].push(productPath);
                        } else {
                            reactantRecipeMembership[reactantId] = [ productPath ];
                        }
                    });

                    // Construct Product
                    fluid.nexus.constructInContainer(componentRoot, productPath, productOptions);
                }
            }
        });
    }
};

fluid.nexus.coOccurrenceEngine.componentDestroyed = function (componentRoot, reactantRecipeMembership, destroyedComponentId) {
    var parentPaths = reactantRecipeMembership[destroyedComponentId];
    fluid.each(parentPaths, function (parentPath) {
        fluid.nexus.destroyInContainer(componentRoot, parentPath);
    });
};
