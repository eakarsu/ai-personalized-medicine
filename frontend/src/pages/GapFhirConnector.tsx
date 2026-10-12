import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-fhir-connector","title":"FHIR / HL7 Connector","description":"Prepare a professional advisory report for fhir / hl7 connector using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapFhirConnector({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
