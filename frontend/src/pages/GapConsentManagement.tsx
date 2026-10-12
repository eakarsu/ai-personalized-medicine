import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-consent-management","title":"Consent Management","description":"Prepare a professional advisory report for consent management using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapConsentManagement({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
