/*
* Copyright 2021-2021 VMware, Inc.
* SPDX-License-Identifier: Apache-2.0
*/

/* eslint-disable no-restricted-syntax */

const dot = require('dot-object');
const fs = require('fs');
const YAML = require('yaml');
const _ = require('lodash');

const utils = require('./utils');
const Parameter = require('./parameter');

/*
 * Returns an array of Parameters
 * The array is parsed from the comments metadata
 * See parameter.js
 */
function parseMetadataComments(valuesFilePath, config) {
  /*  eslint-disable prefer-destructuring */

  const data = fs.readFileSync(valuesFilePath, 'UTF-8');
  const lines = data.split(/\r?\n/);

  const parsedValues = [];
  const paramRegex = new RegExp(`^\\s*${config.comments.format}\\s*${config.tags.param}\\s*([^\\s]+)\\s*(\\[m#.*?\\])?\\s*(\\[t#.*?\\])?\\s*(.*)$`);
  const sectionRegex = new RegExp(`^\\s*${config.comments.format}\\s*${config.tags.section}\\s*(.*)$`);
  const skipRegex = new RegExp(`^\\s*${config.comments.format}\\s*${config.tags.skip}\\s*(.*)$`);
  const extraRegex = new RegExp(`^\\s*${config.comments.format}\\s*${config.tags.extra}\\s*([^\\s]+)\\s*(\\[.*?\\])?\\s*(.*)$`);

  let currentSection = ''; // We assume there will always be a section before any parameter. At least one section is required
  lines.forEach((line) => {
    // Parse param line
    const paramMatch = line.match(paramRegex);
    if (paramMatch && paramMatch.length > 0) {
      const param = new Parameter(paramMatch[1]);
      param.modifier = paramMatch[2] ? paramMatch[2].split('[')[1].split(']')[0].split('#')[1] : '';
      param.title = paramMatch[3] ? paramMatch[3].split('[')[1].split(']')[0].split('#')[1] : '';
      param.description = paramMatch[4];
      param.section = currentSection;
      param.schema = true
      parsedValues.push(param);
    }

    // Parse section line
    const sectionMatch = line.match(sectionRegex);
    if (sectionMatch && sectionMatch.length > 0) {
      currentSection = sectionMatch[1];
    }

    // Parse skip line
    const skipMatch = line.match(skipRegex);
    if (skipMatch && skipMatch.length > 0) {
      const param = new Parameter(skipMatch[1]);
      param.skip = true;
      param.section = currentSection;
      parsedValues.push(param);
    }

    // Parse extra line
    const extraMatch = line.match(extraRegex);
    if (extraMatch && extraMatch.length > 0) {
      const param = new Parameter(extraMatch[1]);
      param.description = extraMatch[3];
      param.value = ''; // Set an empty string by default since it won't have a value in the actual YAML
      param.extra = true;
      param.section = currentSection;
      parsedValues.push(param);
    }
  });

  return parsedValues;
}

/*
 * Returns an array of Parameters parsed from the actual YAML content
 * This object contains the actual type and value of the object
 */
function createValuesObject(valuesFilePath) {
  const resultValues = [];
  const valuesJSON = YAML.parse(fs.readFileSync(valuesFilePath, 'utf8'));
  const dottedFormatProperties = dot.dot(valuesJSON);

  for (let valuePath in dottedFormatProperties) {
    if (Object.prototype.hasOwnProperty.call(dottedFormatProperties, valuePath)) {
      let value = _.get(valuesJSON, valuePath);
      let type = typeof value;

      // Check if the value is a plain array, an array that only contains strings,
      // those strings should not have metadata, the metadata must exist for the array itself
      const valuePathSplit = valuePath.split('[');
      if (valuePathSplit.length > 1) {
        // The value is inside an array
        const arrayPrefix = utils.getArrayPrefix(valuePath);
        let isPlainArray = true; // Assume it is plain until we prove the opposite
        if (typeof _.get(valuesJSON, arrayPrefix) === 'undefined') {
            continue
        }
        _.get(valuesJSON, arrayPrefix).forEach((e) => {
          if (typeof e !== 'string') {
            isPlainArray = false;
          }
        });
        if (isPlainArray) {
          value = _.get(valuesJSON, arrayPrefix);
          valuePath = arrayPrefix;
        }
      }

      // Map the javascript 'null' to golang 'nil'
      if (value === null) {
        value = 'nil';
      }

      // When an element is an object it can be object or array
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          type = 'array';
        }
      }

      // The existence check is needed to avoid duplicate plain array keys
      if (!resultValues.find((v) => v.name === valuePath)) {
        const param = new Parameter(valuePath);
        param.value = value;
        param.type = type;
        resultValues.push(param);
      }
    }
  }

  return resultValues;
}

module.exports = {
  parseMetadataComments,
  createValuesObject,
};
