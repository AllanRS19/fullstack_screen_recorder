import arcject from "@arcjet/next";
import { getEnv } from "./utils";

const aj = arcject({
    key: getEnv('ARCJET_API_KEY'),
    rules: []
});

export default aj;