const Ajv = require('ajv');

const ajv = new Ajv.default();

const schema = {
  type: 'string',
  properties: {
    foo: {type: 'integer'},
    bar: {type: 'string'},
  },
  required: ['foo'],
  additionalProperties: false,
};

const data = {
  foo: 12,
  bar: 'abc',
};

const validate = ajv.compile(schema)
const valid = validate(data)
if (!valid) console.log(validate.errors)