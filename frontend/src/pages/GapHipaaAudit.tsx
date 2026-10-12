import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-hipaa-audit","title":"HIPAA Field-Level Audit","description":"Prepare a professional advisory report for hipaa field-level audit using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapHipaaAudit({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
