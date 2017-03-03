# Linked Data Views #

## Description ##

This is a work in progress and includes research into creating connected web views of Linked Data. It's part of the Fusing Audio and Semantic Technologies (FAST) project, see http://www.semanticaudio.ac.uk/ .

The project uses NodeJS and the Dust templating engine, it interfaces with Fuseki and Mongo databases. 

It indexes JSON data (currently only outputs from Annalist, see http://doi.org/10.5281/zenodo.290669 ) and produces web pages based on that data using reusable templates based on the predicats and objects of an entity.

## Minor Parts ##

Includes a browser based template request system utilising the Dust template engine, see  LDView / public / js / templater.js

Includes a node library to interface with Fuseki, see LDView / lib / fuseki.js

Includes a webviews module to open multiple pages in a single page.

## Build ##

git clone
npm install
create config-local.js
(create folder temp/json/original and temp/json/adjusted)
node bin/jsonld.jena.loader.js (it may throw some unneeded 404s)
node bin/jsonld.mongo.loader.js
node bin/www