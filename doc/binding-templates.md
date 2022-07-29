## How to get Binding Templates?
The notes are derived from the [WoT Binding Templates](https://www.w3.org/TR/wot-binding-templates/) Document. The general steps to create a binding template are given below.

#### Protocol Methods and Options
 - mapping the protocol methods to the abstract WoT Interaction Affordance terms (readproperty, writeproperty, ...)

#### Media Types
  - use should be made of IANA-registered Media Types
  - Translations from proprietary formats to Web-friendly languages like JSON are part of the adaptation needed
  - Media Types enables proper processing of the serialized data

#### Data Types and Value Constraints
  - Simple data types and value constraints are used in a layered and descriptive way in a TD
  - 8-bit unsigned integer: defined as Integer with a minimum of 0 and maximum of 255

### Data Schema
A data schema describes the payload structure and included data items that are passed between the Consumer and the Thing during interactions.

#### Payload Structure
- Payload Structure is determined by DataSchema elements of a Thing Description
- DataSchema elements should be used by an instance of Interaction Affordances
- Special cases:
  + Action Affordances: <code>input</code> and <code>output</code> are used to provide different schemas (data exchanged in both directions)
  + Event Affordances: <code>data</code>, <code>subscription</code>, <code>cancellation</code> are used to describe payload in these cases
  
  ![Screenshot from 2022-07-29 15-52-28](https://user-images.githubusercontent.com/91477109/181775053-2de89844-1622-44ad-908e-311c756ab911.png)

TODO: Are there already dataschemas in Node-WoT? Can the binary-dataschema in rust be reused?

### Forms Element
The form elements contains the URI pointing to an instance of the interaction and descriptions of the protocol settings and options expected to be used.

#### Operation Types
- Operation Types describe the intended semantics of performing the operation
- the <code>op</code> attribute of the form allows the Consumer to select the correct form for the operation

#### Content Types
- Content Types define the serialization details and other rules for processing the payloads -> select a serializer/deserializer
- Content type includes the media type and  parameters, e.g. <code>application/ocf+cbor</code> CBOR serialization is used and OCF rules apply

#### Protocol Methods and Options
- Each protocol may specify different method names for similar operations 
- We want to specify which method to use for a particular Interaction
- HTTP in RDF is used for mehtods and options -> same ontology design pattern are used for a vocabulary for each target protocol

### Interaction Affordances
