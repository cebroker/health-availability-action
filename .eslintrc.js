const settings = require('@condor-labs/eslint-config/config');settings.rules['no-unreachable-loop'] = 'warn';
      settings.parser = '@babel/eslint-parser';
      settings.parserOptions.requireConfigFile= false;module.exports = settings; 
