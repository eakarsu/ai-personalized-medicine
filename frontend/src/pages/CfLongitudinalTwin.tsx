import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-longitudinal-twin","title":"Longitudinal Patient Digital Twin","description":"Prepare a professional advisory report for longitudinal patient digital twin using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfLongitudinalTwin({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
