import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-genome-therapy-designer","title":"Genome Therapy Designer","description":"Prepare a professional advisory report for genome therapy designer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapGenomeTherapyDesigner({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
