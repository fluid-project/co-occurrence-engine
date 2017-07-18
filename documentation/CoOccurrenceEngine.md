Co-Occurrence Engine
====================

A Co-Occurrence Engine is configured with:

- A component-root to monitor
- A set of "recipes"

Each recipe contains:

- A "reactants" section, describing components to match against
- A "product" section, describing a component to be created when all of the
  reactants are present

Reacting to construction and destruction of components
------------------------------------------------------

The Co-Occurrence Engine watches for components being constructed and destroyed
under the component-root. When a new component is created, the Co-Occurrence
Engine checks its recipes for reactant matches, creating any products as
appropriate. When a component is destroyed, all recipe products that use the
destroyed component as a reactant are also destroyed.

Recipe Reactants
----------------

The reactants section describes each component that is required by the recipe.
Each reactant has:

- A name
- A match description, with rules that are checked against the components under
  the Co-Occurrence Engine component-root

In the current implementation, a single match type is provided that tests
against component grade name. In the future more match types will be provided.

An example reactant entry:

    phSensor: {
        match: {
            type: "gradeMatcher",
            gradeName: "gpii.nexus.atlasScientificDriver.phSensor"
        }
    }

Recipe Product
--------------

The product section specifies the component to be constructed in the case that
all of the recipe's reactants are matched. It contains:

- The path at which the product will be created
- The grade options for the product

An example product section:

    product: {
        path: "sendPhSensor",
        options: {
            type: "gpii.nexus.scienceLab.sendPhSensor"
        }
    }

Referencing Reactants within the Product grade
----------------------------------------------

When the Co-Occurrence Engine creates a recipe product component, it configures
a section in the product called "componentPaths" with entries pairing each
reactant with its component path. The product may then use these component
paths, for example via expander calls to `fluid.componentForPath`, to reference
the reactant components.

Sample Recipe and Product grade
-------------------------------

Recipe:

    {
        gradeNames: [ "gpii.nexus.recipe" ],
        reactants: {
            phSensor: {
                match: {
                    type: "gradeMatcher",
                    gradeName: "gpii.nexus.atlasScientificDriver.phSensor"
                }
            },
            collector: {
                match: {
                    type: "gradeMatcher",
                    gradeName: "gpii.nexus.scienceLab.collector"
                }
            }
        },
        product: {
            path: "sendPhSensor",
            options: {
                type: "gpii.nexus.scienceLab.sendPhSensor"
            }
        }
    }

Grade defaults for the "gpii.nexus.scienceLab.sendPhSensor" product:

    {
        gradeNames: [ "gpii.nexus.recipeProduct" ],
        componentPaths: {
            phSensor: null,
            collector: null
        },
        components: {
            phSensor: "@expand:fluid.componentForPath({recipeProduct}.options.componentPaths.phSensor)",
            collector: "@expand:fluid.componentForPath({recipeProduct}.options.componentPaths.collector)"
        },
        modelRelay: {
            source: "{phSensor}.model.sensorData",
            target: "{collector}.model.sensors.phSensor",
            forward: {
                excludeSource: "init"
            },
            singleTransform: {
                type: "fluid.identity"
            }
        },
        listeners: {
            "onDestroy.removePhSensor": {
                listener: "{collector}.applier.change",
                args: [ "sensors.phSensor", null, "DELETE" ]
            }
        }
    }
