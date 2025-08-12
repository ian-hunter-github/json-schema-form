import React, { useState } from 'react'
import { JsonSchemaForm } from '@ianhunterpersonal/jsf-react'

//import '@ianhunterpersonal/jsf-react/dist/index.css';

import './index.css';

const schema = {
  $id: "verify-demo",
  type: "object",
  properties: {
    title: { type: "string", title: "Title" },
    priority: { type: "integer", title: "Priority", enum: [1,2,3], "x-enumNames":["Low","Medium","High"] },
    profile: {
      title: "Profile",
      oneOf: [
        { title: "Person", type: "object", properties: { kind: { const: "person" }, first: { type: "string" }, last: { type: "string" } }, required: ["kind","first","last"] },
        { title: "Company", type: "object", properties: { kind: { const: "company" }, company: { type: "string" } }, required: ["kind","company"] }
      ],
      discriminator: { propertyName: "kind" }
    }
  },
  required: ["title","priority"]
}

export default function App(){
  const [data, setData] = useState<any>({})
  return (
    <div style={{maxWidth:780, margin:"40px auto", padding:"0 16px"}}>
      <h1>@ianhunterpersonal/jsf-react — Verify</h1>
      <JsonSchemaForm
        schema={schema}
        onChange={setData}
        onSubmit={(d)=>alert(JSON.stringify(d,null,2))}
        oneOfBranchTitleVisibility="sr-only"
        constVisibility="hidden"
      />
      <pre style={{background:"#fafafa", border:"1px solid #eee", padding:8, borderRadius:8, marginTop:12}}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
