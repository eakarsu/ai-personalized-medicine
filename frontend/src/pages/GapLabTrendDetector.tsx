import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-lab-trend-detector","title":"Lab Trend Detector","description":"Prepare a professional advisory report for lab trend detector using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapLabTrendDetector({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
