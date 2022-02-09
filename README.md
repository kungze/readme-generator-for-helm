# Readme Generator For Helm

- Autogenerate Helm Charts READMEs' tables based on values YAML file metadata.
- Autogenerate an OpenAPI compliant JSON schema defining the `values.yaml` structure of the Helm Chart. The file generated will be a JSON file formatted according to the [OpenAPIv3 SchemaObject](https://spec.openapis.org/oas/v3.1.0#schema-object) definition.

## How it works

The tool expects some metadata for the descriptions in the provided `values.yaml` file. It will parse and check the metadata against the real values.
If the metadata is consistent with the real values, it will generate and insert the values table into the provided `README.md` file.
If the metadata is not correct, it will print the full list of errors. It checks whether there is metadata for non-existing values or there is missing metadata for an existing value.

The table that will be inserted into the `readme.md` will have the following structure:

```markdown
## Parameters

### Section 1 title

| Name      | Form title | Description             | Default        |
|:----------|:-----------|:------------------------|:---------------|
| `value_1` | value1     |Description for value 1 | `defaultValue` |
| `value_2` | value2     |Description for value 2 | `defaultValue` |
| `value_3` | value3     |Description for value 3 | `defaultValue` |

### Section 2 title

| Name      | Form title | Description             | Default        |
|:----------|:-----------:------------------------|:---------------|
| `value_1` | value1     | Description for value 1 | `defaultValue` |
| `value_2` | value2     | Description for value 2 | `defaultValue` |
| `value_3` | value3     | Description for value 3 | `defaultValue` |

...
```

The number of `#` characters needed for the section titles is dynamically calculated, and the title of the `Parameters` section can be configured via the [configuration file](#configuration-file).

## Requirements

The project has been developed and tested with node version `12.21.0`.

## Install

Execute the following commands to install the tool:

```console
git clone https://github.com/bitnami-labs/readme-generator-for-helm
npm install -g readme-generator-for-helm
```

## Test

We use [Jest](https://jestjs.io) to implement the tests. In order to test your changes, execute the following command:

```console
npm run-script test
```

### Lint

After modifying the code execute the following command to pass the linter:

```console
npm run-script lint
```

## Basic usage

```console
Usage: readme-generator [options]

Options:
  -r, --readme <path>   Path to the README.md file to insert the table
  -v, --values <path>   Path to the values.yaml file
  -c, --config <path>   Path to the config file
  -s, --schema <path>   Path to a file where to store the OpenAPI Schema
  -h, --help            display help for command
```

## values.yaml Metadata

For the tool to work, you need to add some metadata to your `values.yaml` file.

By default we use a format similar to Javadoc, using `@xxx` for tags followed by the tag structure.

The following are the tags supported at this very moment:

- For a parameter: `## @param fullKeyPath [m#modifier] [t#title] Description`.
- For a section: `## @section Section Title"`.
- To skip an object and all its children: `## @skip fullKeyPath`.
- To add a description for an intermediate object (i.e. not final in the YAML tree): `## @extra fullkeyPath Description`.

All the tags as well as the two initial `#` characters for the comments style can be configured in the [configuration file](#configuration-file).

> IMPORTANT: tags' order or position in the file is NOT important except for the @section tag. The @section that will include in the section all the parameters after it until a new section is found or the file ends.

The `modifier` is optional and it will let you override the value of an object. Currently supported modifiers:

- `[array]` Indicates that the value of the parameter must be set to `[]`.
- `[object]` Indicates that the value of the parameter must be set to `{}`.
- `[string]` Indicates that the value of the parameter must be set to `""`.

The modifiers are also customizable via the [configuration file](#configuration-file).

## Configuration file

The configuration file has the following structure:

```
{
  "comments": {
    "format": "##"                       <-- Which is the comments format in the values YAML
  },
  "tags": {
    "param": "@param",                   <-- Tag that indicates a parameter
    "section": "@section",               <-- Tag that indicates a section
    "skip": "@skip",                     <-- Tag that indicates the object must be skipped
    "extra": "@extra"                    <-- Tag to add a description for an intermediate object
  },
  "modifiers": {
    "array": "array",                    <-- Modifier that indicates an array type
    "object": "object"                   <-- Modifier that indicates an object type
    "string": "string"                   <-- Modifier that indicates a string type
  },
  "regexp": {
    "paramsSectionTitle": "Parameters"   <-- Title of the parameters section to replace in the README.md
  }
}
```

## Versions

# 2.0.0

The -m (--metadata) option has been renamed to -s (--schema) in order to properly identify what it generates.
