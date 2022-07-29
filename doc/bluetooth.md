# Bluetooth
Information about Bluetooth from the (Core specification)[https://www.bluetooth.com/specifications/specs/core-specification-5-3/] 

## GENERIC ACCESS PROFILE (GAP) [6.2]
 
- Base profile which all Bluetooth devices implement -> any additional profiles are a supersets of GAP
- GAP roles in LE: Broadcaster, Observer, Peripheral, and Central
    + Broadcaster: 
        - optimized for transmitter only applications
        - use advertising to broadcast data
        - does not support connections
    + Observer: 
        - optimized for receiver only applications
        - complementary device for a Broadcaster
        - receives broadcast data contained in advertisements
        - does not support connections
    + Peripheral: 
        - optimized for devices that support a single connection;
    + Central:
        - supports multiple connections
        - initiator for all connections with devices in the Peripheral role


## GENERIC ATTRIBUTE ARCHITECTURE [6.4]

### Attribute Protocol (ATT)
- Used to read and write small data values held on a server
- Each stored value is known as an attribute
- Each attribute is self-identifying using UUIDs
- UUIDs can be well-known assigned numbers or vendor assigned 128-bit UUID
- ATT defines two roles: Client and Server (device can be both at the same time)
- ATT Server:
    + stores the attributes
    + accepts Attribute protocol requests, commands and confirmations form ATT client
    + sends responses to requests, indications, and notifications asynchronously to the ATT client

### Generic Attribute Profile (GATT)
- built on top of ATT
- GATT defines two roles: Server and Client
- A GATT Client or Server is also an ATT Client or Server
- GATT roles are not necessarily tied to specific GAP roles
- GATT specifies the format of data contained on the GATT Server
- Attribute structure:
    + Attributes, as transported by the Attribute protocol, are formatted as Services and Characteristics
    + Services may contain characteristics
    + Characteristics contain a single value and any number of descriptors describing the characteristic value
- GATT Client can traverse the GATT Server and display characteristic values 
- characteristic descriptors can be used to display descriptions of the characteristic values that may make the value understandable by the user


### GATT-BASED PROFILE HIERARCHY [6.5]
- top level of the hierarchy is a profile
- profile is composed of one or more services necessary to fulfill a use case
- service is composed of characteristics or references to other services
- characteristic contains a value and may contain optional information about the value


### Additonal Information
- The maximum length of an attribute value shall be 512 octets. [3.2.9]
    + Each of Services, Characteristics, and Descriptors is an attribute, so max length is 512 bytes