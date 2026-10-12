import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-dose-personalizer","title":"Dose Personalizer","description":"Prepare a professional advisory report for dose personalizer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapDosePersonalizer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
