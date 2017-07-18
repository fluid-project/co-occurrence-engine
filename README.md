Nexus Co-Occurrence Engine
==========================

The Co-Occurrence Engine provides support for automated configuration of sets of
Infusion components.

The Co-Occurrence Engine monitors the components present under a configured
component-root and can create components, connect them together, and destroy
components based on the presence, or absence, of component groupings described
in Co-Occurrence Engine "recipes".

Nexus with Co-Occurrence Engine
-------------------------------

This repository includes a grade, `gpii.nexus.nexusWithCoOccurrenceEngine`, and
runner script, `nexusWithCoOccurrenceEngine.js`, to run a Nexus instance with a
Co-Occurrence Engine. To start such a Nexus instance:

    > node nexusWithCoOccurrenceEngine.js

Documentation
-------------

- [Co-Occurrence Engine](documentation/CoOccurrenceEngine.md)
