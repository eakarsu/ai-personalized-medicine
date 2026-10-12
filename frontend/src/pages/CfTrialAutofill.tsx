import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-trial-autofill","title":"Clinical Trial Auto-Fill","description":"Prepare a professional advisory report for clinical trial auto-fill using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfTrialAutofill({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
