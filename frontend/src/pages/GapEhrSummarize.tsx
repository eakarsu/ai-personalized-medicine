import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-ehr-summarize","title":"EHR Summarization","description":"Prepare a professional advisory report for ehr summarization using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapEhrSummarize({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
