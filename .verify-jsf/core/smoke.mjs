import { createEngine } from "@ianhunterpersonal/jsf-core";
const schema = { type:"object", properties:{ email:{ type:"string", format:"email" }}, required:["email"] };
const engine = createEngine(schema, { email:"a@b.co" });
const ok = engine.validate();
if (!ok) { console.error("core validate failed", engine.getState().errors); process.exit(1); }
console.log("core: OK");
