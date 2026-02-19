import Ajv from "ajv";
import addFormats from "ajv-formats";
const assignmentInputSchema = require("./assignment-input.schema.json");

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(assignmentInputSchema);

export function validateAssignment(data: unknown) {
    const valid = validate(data);
    return {
        valid,
        errors: validate.errors
    };
}